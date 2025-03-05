import User from "../models/User.js";
import shopify from "../shopify.js";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, generatePresignedUrl } from '../config/r2.js';
import { v4 as uuidv4 } from 'uuid';

export const updateSabbathSettings = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    
    if (!session || !session.accessToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid session"
      });
    }

    const {
      isSabbathMode,
      isAutoSabbathMode,
      closingDay,
      openingDay,
      closingTime,
      openingTime,
      sabbathFile,
      bannerText,
      socialLinks,
      bannerBgColor,
      bannerTextColor
    } = req.body;

    // Set default values and validate
    const settingsData = {
      isSabbathMode: Boolean(isSabbathMode),
      isAutoSabbathMode: Boolean(isAutoSabbathMode),
      closingDay: closingDay || 'Friday',
      openingDay: openingDay || 'Saturday',
      closingTime: closingTime || '00:00',
      openingTime: openingTime || '00:00',
      sabbathFile: sabbathFile || '',
      bannerText: bannerText || '',
      socialLinks: socialLinks || [],
      bannerBgColor: bannerBgColor || '#FFFFFF',
      bannerTextColor: bannerTextColor || '#000000'
    };

    // Update MongoDB
    const shopId = session.shop;
    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: settingsData },
      { new: true, upsert: true }
    );

    try {
      const client = new shopify.api.clients.Graphql({ session });
      
      // Get shop ID
      const shopResponse = await client.request(`
        query {
          shop {
            id
          }
        }
      `);

      const shopGid = shopResponse.data.shop.id;

      // Update metafields
      const metafields = [
        {
          key: "sabbath_mode",
          namespace: "custom",
          ownerId: shopGid,
          type: "boolean",
          value: settingsData.isSabbathMode.toString()
        },
        {
          key: "auto_sabbath_mode",
          namespace: "custom",
          ownerId: shopGid,
          type: "boolean", 
          value: settingsData.isAutoSabbathMode.toString()
        },
        {
          key: "closing_day",
          namespace: "custom",
          ownerId: shopGid,
          type: "single_line_text_field",
          value: settingsData.closingDay
        },
        {
          key: "opening_day",
          namespace: "custom",
          ownerId: shopGid,
          type: "single_line_text_field",
          value: settingsData.openingDay
        },
        {
          key: "closing_time",
          namespace: "custom",
          ownerId: shopGid,
          type: "single_line_text_field",
          value: settingsData.closingTime
        },
        {
          key: "opening_time", 
          namespace: "custom",
          ownerId: shopGid,
          type: "single_line_text_field",
          value: settingsData.openingTime
        },
        {
          key: "banner_text",
          namespace: "custom",
          ownerId: shopGid,
          type: "single_line_text_field",
          value: settingsData.bannerText
        },
        {
          key: "social_links",
          namespace: "custom",
          ownerId: shopGid,
          type: "json",
          value: JSON.stringify(settingsData.socialLinks)
        },
        {
          key: "banner_bg_color",
          namespace: "custom",
          ownerId: shopGid,
          type: "single_line_text_field",
          value: settingsData.bannerBgColor
        },
        {
          key: "banner_text_color",
          namespace: "custom",
          ownerId: shopGid,
          type: "single_line_text_field",
          value: settingsData.bannerTextColor
        }
      ];

      const metafieldSetMutation = `
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              namespace
              value
              type
            }
            userErrors {
              field
              message
              code
            }
          }
        }
      `;

      await client.request(metafieldSetMutation, {
        variables: {
          metafields,
        },
      });

    } catch (shopifyError) {
      console.error("Shopify API Error:", shopifyError);
      return res.status(200).json({
        success: true,
        message: "Settings saved locally. Shopify sync will retry later.",
        user,
        shopifyError: shopifyError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sabbath settings updated successfully",
      user
    });

  } catch (error) {
    console.error("Error updating Sabbath settings:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating Sabbath settings",
      error: error.message
    });
  }
};

export const uploadSabbathFile = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Enhanced credential validation
    const requiredCredentials = [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME',
      'R2_PUBLIC_URL'
    ];

    const missingCredentials = requiredCredentials.filter(cred => !process.env[cred]);
    if (missingCredentials.length > 0) {
      console.error('Missing R2 credentials:', missingCredentials);
      return res.status(500).json({ 
        error: 'R2 configuration incomplete',
        missing: missingCredentials
      });
    }

    const shop = session.shop;
    const fileId = uuidv4();
    const fileExtension = req.file.originalname.split('.').pop();
    const key = `sabbath/${shop}/${fileId}.${fileExtension}`;

    try {
      // Enhanced command configuration
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read',
        // Add required metadata
        Metadata: {
          'app-name': 'sabbath-app',
          'shop': shop
        }
      });

      // Add error handling for the upload
      try {
        await r2Client.send(command);
      } catch (uploadError) {
        console.error('Upload error details:', {
          error: uploadError.message,
          code: uploadError.Code,
          requestId: uploadError.$metadata?.requestId,
          cfId: uploadError.$metadata?.cfId
        });
        throw uploadError;
      }

      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      // Log successful upload
      console.log('File uploaded successfully:', {
        shop,
        key,
        publicUrl,
        contentType: req.file.mimetype
      });

      res.json({ 
        success: true, 
        fileUrl: publicUrl,
        key,
        metadata: {
          contentType: req.file.mimetype,
          size: req.file.size,
          filename: req.file.originalname
        }
      });

    } catch (error) {
      console.error('R2 error details:', {
        error: error.message,
        code: error.Code,
        metadata: error.$metadata,
        stack: error.stack
      });
      res.status(500).json({ 
        error: 'Failed to upload to R2',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Error in upload:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload file',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getUploadUrl = async (req, res) => {
  try {
    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const shop = session.shop;
    const { filename, contentType } = req.body;
    const fileId = uuidv4();
    const fileExtension = filename.split('.').pop();
    const key = `sabbath/${shop}/${fileId}.${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read',
        // Add CORS-specific headers
        Metadata: {
          'app-name': 'sabbath-app'
        }
      });

      const uploadUrl = await generatePresignedUrl(key, contentType, {
        expiresIn: 3600,
        // Add required headers for CORS
        signableHeaders: new Set([
          'content-type',
          'x-amz-acl',
          'host'
        ])
      });

      res.json({
        uploadUrl,
        imageId: fileId,
        key: key,
        // Add required headers for the frontend
        headers: {
          'Content-Type': contentType,
          'x-amz-acl': 'public-read'
        }
      });

    } catch (error) {
      console.error('R2 error:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }

  } catch (error) {
    console.error('Error in getUploadUrl:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getImageUrl = async (req, res) => {
  try {
    const { imageId } = req.params;
    const session = res.locals.shopify.session;
    
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const shop = session.shop;
    const key = `sabbath/${shop}/${imageId}`;

    // Construct the public URL on the backend
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Error getting image URL:', error);
    res.status(500).json({ error: 'Failed to get image URL' });
  }
};