export const notifications = [
  {
    id: "order_confirmation",
    title: "אישור הזמנה",
    subject: `ההזמנה של {{name}} אושרה`,
    body: `{% assign delivery_method_types = delivery_agreements | map: 'delivery_method_type' | uniq %}
{% if delivery_method_types.size > 1 %}
  {% assign has_split_cart = true %}
{% else %}
  {% assign has_split_cart = false %}
{% endif %}

{% capture email_title %}
  {% if has_pending_payment %}
    תודה על ההזמנה שלך!
  {% else %}
    תודה על הרכישה שלך!
  {% endif %}
{% endcapture %}
{% capture email_body %}
  {% if has_pending_payment %}
    {% if buyer_action_required %}
      תקבל/י אישור במייל לאחר השלמת התשלום.
    {% else %}
      התשלום שלך בעיבוד. תקבל/י מייל כאשר ההזמנה תאושר.
    {% endif %}
  {% else %}
    {% if requires_shipping %}
    {% case delivery_method %}
        {% when 'pick-up' %}
          תקבל/י מייל כאשר ההזמנה תהיה מוכנה לאיסוף.
        {% when 'local' %}
          שלום {{ customer.first_name }}, אנו מכינים את ההזמנה שלך למשלוח.
        {% else %}
          אנו מכינים את ההזמנה שלך למשלוח. נעדכן אותך כאשר תישלח.
      {% endcase %}
        {% if delivery_instructions != blank  %}
          <p><b>הוראות משלוח:</b> {{ delivery_instructions }}</p>
        {% endif %}
       {% if consolidated_estimated_delivery_time %}
        {% if has_multiple_delivery_methods %}
          <h3 class="estimated_delivery__title">זמן אספקה משוער</h3>
          <p>{{ consolidated_estimated_delivery_time }}</p>
        {% else %}
          <p>
            זמן אספקה משוער <b>{{ consolidated_estimated_delivery_time }}</b>
          </p>
        {% endif %}
       {% endif %}
    {% endif %}
  {% endif %}
  {% assign gift_card_line_items = line_items | where: "gift_card" %}
  {% assign found_gift_card_with_recipient_email = false %}
  {% for line_item in gift_card_line_items %}
    {% if line_item.properties["__shopify_send_gift_card_to_recipient"] and line_item.properties["Recipient email"] %}
      {% assign found_gift_card_with_recipient_email = true %}
      {% break %}
    {% endif %}
  {% endfor %}
  {% if found_gift_card_with_recipient_email %}
    <p>המקבל של כרטיס המתנה יקבל מייל עם קוד הכרטיס.</p>
  {% elsif gift_card_line_items.first %}
    <p>תקבל/י מיילים נפרדים עבור כרטיסי מתנה.</p>
  {% endif %}
{% endcapture %}

<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
  <title>{{ email_title }}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width">
  <link rel="stylesheet" type="text/css" href="/assets/notifications/styles.css">
  <style>
    .button__cell { background: {{ shop.email_accent_color }}; }
    a, a:hover, a:active, a:visited { color: {{ shop.email_accent_color }}; }
    body, table { direction: rtl; }
  </style>
</head>

  <body>
    <table class="body">
      <tr>
        <td>
          <table class="header row">
  <tr>
    <td class="header__cell">
      <center>

        <table class="container">
          <tr>
            <td>

              <table class="row">
                <tr>
                  <td class="shop-name__cell">
                   {%  %}-
                    {%- else %}
                      <h1 class="shop-name__text">
                        <a href="{{shop.url}}">{{ shop.name }}</a>
                      </h1>
                    {%- endif %}
                  </td>

                    <td>
                      <table class="order-po-number__container">
                        <tr>
                          <td class="order-number__cell">
                            <span class="order-number__text">
                              הזמנה {{ order_name }}
                            </span>
                          </td>
                        </tr>
                        {%- if po_number %}
                            <tr>
                              <td class="po-number__cell">
                                <span class="po-number__text">
                                  מספר הזמנת רכש #{{ po_number }}
                                </span>
                              </td>
                            </tr>
                        {%- endif %}
                      </table>
                    </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </center>
    </td>
  </tr>
</table>

          <table class="row content">
  <tr>
    <td class="content__cell">
      <center>
        <table class="container">
          <tr>
            <td>
              
            <h2>{{ email_title }}</h2>
            <p>{{ email_body }}</p>
            {% assign transaction_count = transactions | size %}
  {% if transaction_count > 0 %}
    {% for transaction in transactions %}
      {% if transaction.show_buyer_pending_payment_instructions? %}
        <p> {{transaction.buyer_pending_payment_notice}} </p>
        <p>
        <table class="row">
          <tr>
            {% for instruction in transaction.buyer_pending_payment_instructions %}
              <td>{{ instruction.header }}</td>
            {% endfor %}
            <td>סכום</td>
          </tr>
          <tr>
            {% for instruction in transaction.buyer_pending_payment_instructions %}
              <td>{{ instruction.value }}</td>
            {% endfor %}
            <td>{{transaction.amount | money}}</td>
          </tr>
        </table>
        </p>
      {% endif %}
    {% endfor%}
  {% endif %}

            {% if order_status_url %}
              <table class="row actions">
  <tr>
    <td class="empty-line">&nbsp;</td>
  </tr>
  <tr>
    <td class="actions__cell">
      <table class="button main-action-cell">
        <tr>
          <td class="button__cell"><a href="{{ order_status_url }}" class="button__text">צפה בהזמנה שלך</a></td>
        </tr>
      </table>
      {% if shop.url %}
    <table class="link secondary-action-cell">
      <tr>
        <td class="link__cell">או <a href="{{ shop.url }}">בקר בחנות שלנו</a></td>
      </tr>
    </table>
{% endif %}

    </td>
  </tr>
</table>

            {% else %}
              {% if shop.url %}
    <table class="row actions">
      <tr>
        <td class="actions__cell">
          <table class="button main-action-cell">
            <tr>
              <td class="button__cell"><a href="{{ shop.url }}" class="button__text">בקר בחנות שלנו</a></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
{% endif %}

            {% endif %}

            </td>
          </tr>
        </table>
      </center>
    </td>
  </tr>
</table>

          <table class="row section">
  <tr>
    <td class="section__cell">
      <center>
        <table class="container">
          <tr>
            <td>
              <h3>סיכום הזמנה</h3>
            </td>
          </tr>
        </table>
        <table class="container">
          <tr>
            <td>
              
            {% if has_split_cart %}
              
<table class="row">
  {% for line in subtotal_line_items %}
    {% unless line.delivery_agreement %}
        {% if line.groups.size == 0 %}
          {% assign legacy_separator = true %}
          
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.presentment_title %}
          {% assign line_title = line.presentment_title %}
        {% elsif line.title %}
          {% assign line_title = line.title %}
        {% else %}
          {% assign line_title = line.product.title %}
        {% endif %}
        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} of {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' and line.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% elsif line.variant.title != 'Default Title' and line.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.bundle_components %}
            <table>
              <tr class="order-list__item">
                <td class="order-list__bundle-item">
                  <table>
                    <td class="order-list__image-cell">
                      {% if component.image %}
                        <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image small"/>
                      {% else %}
                        <div class="order-list__no-image-cell small">
                          <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                        </div>
                      {% endif %}
                    </td>

                    <td class="order-list__product-description-cell">
                      {% if component.product.title %}
                        {% assign component_title = component.product.title %}
                      {% else %}
                        {% assign component_title = component.title %}
                      {% endif %}

                      {% assign component_display = component.quantity %}

                      <span class="order-list__item-title">{{ component_display }}&nbsp;&times;&nbsp;{{ component_title }}</span><br>

                      {% if component.variant.title != 'Default Title'%}
                        <span class="order-list__item-variant">{{ component.variant.title }}</span>
                      {% endif %}
                    </td>
                  </table>
                </td>
              </tr>
            </table>
          {% endfor %}
        {% else %}
          {% for group in line.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}

          {% if line.gift_card and line.properties["__shopify_send_gift_card_to_recipient"] %}
            {% for property in line.properties %}
  {% assign property_first_char = property.first | slice: 0 %}
  {% if property.last != blank and property_first_char != '_' %}
    <div class="order-list__item-property">
      <dt>{{ property.first }}:</dt>
      <dd>
      {% if property.last contains '/uploads/' %}
        <a href="{{ property.last }}" class="link" target="_blank">
        {{ property.last | split: '/' | last }}
        </a>
      {% else %}
        {{ property.last }}
      {% endif %}
      </dd>
    </div>
  {% endif %}
{% endfor %}

          {% endif %}

        {% if line.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
            <p>
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            </p>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        {% if expand_bundles and line.bundle_parent? %}
          <td class="order-list__parent-price-cell">
        {% else %}
          <td class="order-list__price-cell">
        {% endif %}
        {% if line.original_line_price != line.final_line_price %}
          <del class="order-list__item-original-price">{{ line.original_line_price | money }}</del>
        {% endif %}
          <p class="order-list__item-price">
            {% if line.final_line_price > 0 %}
              {{ line.final_line_price | money }}
              {% if line.unit_price_measurement %}
  <div class="order-list__unit-price">
    {{- line.unit_price | unit_price_with_measurement: line.unit_price_measurement -}}
  </div>
{% endif %}
            {% else %}
              חינם
            {% endif %}
          </p>
        </td>
    </table>
  </td>
</tr>

        {% endif %}
    {% endunless %}
  {% endfor %}

    {% for line_item_group in line_item_groups %}
      {% unless line_item_group.components.first.delivery_agreement %}
        {% assign legacy_separator = true %}
        
{% assign final_line_price = 0 %}
{% assign original_line_price = 0 %}
{% assign discount_keys_str = "" %}
{% assign parent_line_item = nil %}

{% if line_item_group.deliverable? == false %}
  {% for component in line_item_group.components %}
    {% assign final_line_price = final_line_price | plus: component.final_line_price %}
    {% assign original_line_price = original_line_price | plus: component.original_line_price %}

    {% for da in component.discount_allocations %}
      {% if da.discount_application.target_selection != 'all' %}
        {% assign discount_key = da.discount_application.title | append: da.discount_application.type %}
        {% assign discount_keys_str = discount_keys_str | append: discount_key | append: "," %}
      {% endif %}
    {% endfor %}
  {% endfor %}
{% endif %}

{% if line_item_group.deliverable? %}
    {% assign parent_line_item = line_item_group.parent_sales_line_item %}
    {% assign final_line_price = parent_line_item.final_line_price %}
    {% assign original_line_price = parent_line_item.original_line_price %}
{% endif %}

{% assign discount_keys = discount_keys_str | split: "," | uniq %}

<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        <td class="order-list__parent-image-cell">
          {% if parent_line_item and parent_line_item.image %}
            <img src="{{ parent_line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% elsif line_item_group.image %}
            <img src="{{ line_item_group | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
        
        <td class="order-list__product-description-cell">
          <table>
            <tr>
              <td class="order-list__product-description-cell" colspan="2">
                <span class="order-list__item-title">{{ line_item_group.title }}&nbsp;&times;&nbsp;{{ line_item_group.quantity }}</span><br/>
                {% if line_item_group.variant and line_item_group.variant.title != 'Default Title' %}
                  <span class="order-list__item-variant">{{ line_item_group.variant.title }}</span>
                {% endif %}
                
                {% if line_item_group.deliverable? %}
                  {% if parent_line_item.discount_allocations %}
                    {% for discount_allocation in parent_line_item.discount_allocations %}
                      {% if discount_allocation.discount_application.target_selection != 'all' %}
                        <p>
                          <span class="order-list__item-discount-allocation">
                            <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                            <span>
                              {{ discount_allocation.discount_application.title | upcase }}
                              (-{{ discount_allocation.amount | money }})
                            </span>
                          </span>
                        </p>
                      {% endif %}
                    {% endfor %}
                  {% endif %}
                {% else %}
                  {% for discount_key in discount_keys %}
                    {% assign discount_amount = 0 %}

                    {% for component in line_item_group.components %}
                      {% for da in component.discount_allocations %}
                        {% assign key = da.discount_application.title | append: da.discount_application.type %}
                        {% if da.discount_application.target_selection != 'all' and key == discount_key %}
                          {% assign discount_amount = discount_amount | plus: da.amount %}
                          {% assign discount_title = da.discount_application.title %}
                        {% endif %}
                      {% endfor %}
                    {% endfor %}

                    <p>
                      <span class="order-list__item-discount-allocation">
                        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                        <span>
                          {{ discount_title | upcase }}
                          (-{{ discount_amount | money }})
                        </span>
                      </span>
                    </p>
                  {% endfor %}
                {% endif %}
              </td>

                <td class="order-list__parent_price-cell">
                  {% if original_line_price != final_line_price %}
                    <del class="order-list__item-original-price">{{ original_line_price | money }}</del>
                  {% endif %}
                  <p class="order-list__item-price">
                    {% if final_line_price > 0 %}
                      {{ final_line_price | money }}
                    {% else %}
                      {{ 'notifications.views.mailers.notifications.discount_free' | t: default: 'חינם' }}
                    {% endif %}
                  </p>
                </td>
            </tr>
            
            {% for component in line_item_group.components %}
              <tr>
                <td class="order-list__image-cell order-list__bundle-item{% if line_item_group.deliverable? %} order-list__deliverable-item{% endif %}">
                  {% if component.image %}
                    <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image"/>
                  {% else %}
                    <div class="order-list__no-image-cell small">
                      <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                    </div>
                  {% endif %}
                </td>

                <td class="order-list__product-description-cell{% if line_item_group.deliverable? %} order-list__deliverable-item{% endif %}">
                  {% if component.product.title %}
                    {% assign component_title = component.product.title %}
                  {% else %}
                    {% assign component_title = component.title %}
                  {% endif %}
                  
                  <span class="order-list__item-title">{{ component_title }}&nbsp;&times;&nbsp;{{ component.quantity }}</span><br/>

                  {% if component.variant.title != 'Default Title' %}
                    <span class="order-list__item-variant">{{ component.variant.title }}</span>
                  {% endif %}

                  {% if line_item_group.deliverable? %}
                    {% if component.discount_allocations %}
                      {% for discount_allocation in component.discount_allocations %}
                        {% if discount_allocation.discount_application.target_selection != 'all' %}
                        <p>
                          <span class="order-list__item-discount-allocation">
                            <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                            <span>
                              {{ discount_allocation.discount_application.title | upcase }}
                              (-{{ discount_allocation.amount | money }})
                            </span>
                          </span>
                        </p>
                        {% endif %}
                      {% endfor %}
                    {% endif %}
                  {% endif %}
                </td>

                  {% if line_item_group.deliverable? %}
                    <td class="order-list__price-cell">
                      {% if component.original_line_price != component.final_line_price %}
                        <del class="order-list__item-original-price">{{ component.original_line_price | money }}</del>
                      {% endif %}
                      <p class="order-list__item-price">
                        {% if component.final_line_price > 0 %}
                          {{ component.final_line_price | money }}
                        {% else %}
                          חינם
                        {% endif %}
                      </p>
                    </td>
                  {% endif %}
              </tr>
            {% endfor %}
          </table>
      </td>
    </table>
  </td>
</tr>
      {% endunless %}
    {% endfor %}
</table>

{% if legacy_separator %}
  <hr class="order-list__delivery-method-type-separator">
{% endif %}

{% for delivery_agreement in delivery_agreements %}
  {% if delivery_agreement.line_items != blank %}
    {% if delivery_agreements.size > 1 %}
      <h4 class="order-list__delivery-method-type">
        פריטי {{ delivery_agreement.delivery_method_name }}
      </h4>
    {% endif %}

    <table class="row">
      {% for line in delivery_agreement.line_items %}
          {% if line.groups.size == 0 %}
            
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.presentment_title %}
          {% assign line_title = line.presentment_title %}
        {% elsif line.title %}
          {% assign line_title = line.title %}
        {% else %}
          {% assign line_title = line.product.title %}
        {% endif %}
        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} of {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' and line.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% elsif line.variant.title != 'Default Title' and line.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.bundle_components %}
            <table>
              <tr class="order-list__item">
                <td class="order-list__bundle-item">
                  <table>
                    <td class="order-list__image-cell">
                      {% if component.image %}
                        <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image small"/>
                      {% else %}
                        <div class="order-list__no-image-cell small">
                          <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                        </div>
                      {% endif %}
                    </td>

                    <td class="order-list__product-description-cell">
                      {% if component.product.title %}
                        {% assign component_title = component.product.title %}
                      {% else %}
                        {% assign component_title = component.title %}
                      {% endif %}

                      {% assign component_display = component.quantity %}

                      <span class="order-list__item-title">{{ component_display }}&nbsp;&times;&nbsp;{{ component_title }}</span><br>

                      {% if component.variant.title != 'Default Title'%}
                        <span class="order-list__item-variant">{{ component.variant.title }}</span>
                      {% endif %}
                    </td>
                  </table>
                </td>
              </tr>
            </table>
          {% endfor %}
        {% else %}
          {% for group in line.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}

          {% if line.gift_card and line.properties["__shopify_send_gift_card_to_recipient"] %}
            {% for property in line.properties %}
  {% assign property_first_char = property.first | slice: 0 %}
  {% if property.last != blank and property_first_char != '_' %}
    <div class="order-list__item-property">
      <dt>{{ property.first }}:</dt>
      <dd>
      {% if property.last contains '/uploads/' %}
        <a href="{{ property.last }}" class="link" target="_blank">
        {{ property.last | split: '/' | last }}
        </a>
      {% else %}
        {{ property.last }}
      {% endif %}
      </dd>
    </div>
  {% endif %}
{% endfor %}

          {% endif %}

        {% if line.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
            <p>
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            </p>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        {% if expand_bundles and line.bundle_parent? %}
          <td class="order-list__parent-price-cell">
        {% else %}
          <td class="order-list__price-cell">
        {% endif %}
        {% if line.original_line_price != line.final_line_price %}
          <del class="order-list__item-original-price">{{ line.original_line_price | money }}</del>
        {% endif %}
          <p class="order-list__item-price">
            {% if line.final_line_price > 0 %}
              {{ line.final_line_price | money }}
              {% if line.unit_price_measurement %}
  <div class="order-list__unit-price">
    {{- line.unit_price | unit_price_with_measurement: line.unit_price_measurement -}}
  </div>
{% endif %}
            {% else %}
              חינם
            {% endif %}
          </p>
        </td>
    </table>
  </td>
</tr>

          {% endif %}
      {% endfor %}
    </table>

    {% unless forloop.last %}
      <hr class="order-list__delivery-method-type-separator">
    {% endunless %}
  {% endif %}
{% endfor %}

            {% else %}
              
  
<table class="row">
  {% for line in non_parent_line_items %}
    {% if line.groups.size == 0 %}
      
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.presentment_title %}
          {% assign line_title = line.presentment_title %}
        {% elsif line.title %}
          {% assign line_title = line.title %}
        {% else %}
          {% assign line_title = line.product.title %}
        {% endif %}
        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} of {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' and line.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% elsif line.variant.title != 'Default Title' and line.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.bundle_components %}
            <table>
              <tr class="order-list__item">
                <td class="order-list__bundle-item">
                  <table>
                    <td class="order-list__image-cell">
                      {% if component.image %}
                        <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image small"/>
                      {% else %}
                        <div class="order-list__no-image-cell small">
                          <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                        </div>
                      {% endif %}
                    </td>

                    <td class="order-list__product-description-cell">
                      {% if component.product.title %}
                        {% assign component_title = component.product.title %}
                      {% else %}
                        {% assign component_title = component.title %}
                      {% endif %}

                      {% assign component_display = component.quantity %}

                      <span class="order-list__item-title">{{ component_display }}&nbsp;&times;&nbsp;{{ component_title }}</span><br>

                      {% if component.variant.title != 'Default Title'%}
                        <span class="order-list__item-variant">{{ component.variant.title }}</span>
                      {% endif %}
                    </td>
                  </table>
                </td>
              </tr>
            </table>
          {% endfor %}
        {% else %}
          {% for group in line.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}

          {% if line.gift_card and line.properties["__shopify_send_gift_card_to_recipient"] %}
            {% for property in line.properties %}
  {% assign property_first_char = property.first | slice: 0 %}
  {% if property.last != blank and property_first_char != '_' %}
    <div class="order-list__item-property">
      <dt>{{ property.first }}:</dt>
      <dd>
      {% if property.last contains '/uploads/' %}
        <a href="{{ property.last }}" class="link" target="_blank">
        {{ property.last | split: '/' | last }}
        </a>
      {% else %}
        {{ property.last }}
      {% endif %}
      </dd>
    </div>
  {% endif %}
{% endfor %}

          {% endif %}

        {% if line.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
            <p>
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            </p>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        {% if expand_bundles and line.bundle_parent? %}
          <td class="order-list__parent-price-cell">
        {% else %}
          <td class="order-list__price-cell">
        {% endif %}
        {% if line.original_line_price != line.final_line_price %}
          <del class="order-list__item-original-price">{{ line.original_line_price | money }}</del>
        {% endif %}
          <p class="order-list__item-price">
            {% if line.final_line_price > 0 %}
              {{ line.final_line_price | money }}
              {% if line.unit_price_measurement %}
  <div class="order-list__unit-price">
    {{- line.unit_price | unit_price_with_measurement: line.unit_price_measurement -}}
  </div>
{% endif %}
            {% else %}
              חינם
            {% endif %}
          </p>
        </td>
    </table>
  </td>
</tr>
      {% endunless %}
    {% endfor %}
</table>

{% if legacy_separator %}
  <hr class="order-list__delivery-method-type-separator">
{% endif %}

{% for delivery_agreement in delivery_agreements %}
  {% if delivery_agreement.line_items != blank %}
    {% if delivery_agreements.size > 1 %}
      <h4 class="order-list__delivery-method-type">
        פריטי {{ delivery_agreement.delivery_method_name }}
      </h4>
    {% endif %}

    <table class="row">
      {% for line in delivery_agreement.line_items %}
          {% if line.groups.size == 0 %}
            
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.presentment_title %}
          {% assign line_title = line.presentment_title %}
        {% elsif line.title %}
          {% assign line_title = line.title %}
        {% else %}
          {% assign line_title = line.product.title %}
        {% endif %}
        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} of {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' and line.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% elsif line.variant.title != 'Default Title' and line.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.bundle_components %}
            <table>
              <tr class="order-list__item">
                <td class="order-list__bundle-item">
                  <table>
                    <td class="order-list__image-cell">
                      {% if component.image %}
                        <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image small"/>
                      {% else %}
                        <div class="order-list__no-image-cell small">
                          <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                        </div>
                      {% endif %}
                    </td>

                    <td class="order-list__product-description-cell">
                      {% if component.product.title %}
                        {% assign component_title = component.product.title %}
                      {% else %}
                        {% assign component_title = component.title %}
                      {% endif %}

                      {% assign component_display = component.quantity %}

                      <span class="order-list__item-title">{{ component_display }}&nbsp;&times;&nbsp;{{ component_title }}</span><br>

                      {% if component.variant.title != 'Default Title'%}
                        <span class="order-list__item-variant">{{ component.variant.title }}</span>
                      {% endif %}
                    </td>
                  </table>
                </td>
              </tr>
            </table>
          {% endfor %}
        {% else %}
          {% for group in line.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}

          {% if line.gift_card and line.properties["__shopify_send_gift_card_to_recipient"] %}
            {% for property in line.properties %}
  {% assign property_first_char = property.first | slice: 0 %}
  {% if property.last != blank and property_first_char != '_' %}
    <div class="order-list__item-property">
      <dt>{{ property.first }}:</dt>
      <dd>
      {% if property.last contains '/uploads/' %}
        <a href="{{ property.last }}" class="link" target="_blank">
        {{ property.last | split: '/' | last }}
        </a>
      {% else %}
        {{ property.last }}
      {% endif %}
      </dd>
    </div>
  {% endif %}
{% endfor %}

          {% endif %}

        {% if line.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
            <p>
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            </p>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        {% if expand_bundles and line.bundle_parent? %}
          <td class="order-list__parent-price-cell">
        {% else %}
          <td class="order-list__price-cell">
        {% endif %}
        {% if line.original_line_price != line.final_line_price %}
          <del class="order-list__item-original-price">{{ line.original_line_price | money }}</del>
        {% endif %}
          <p class="order-list__item-price">
            {% if line.final_line_price > 0 %}
              {{ line.final_line_price | money }}
              {% if line.unit_price_measurement %}
  <div class="order-list__unit-price">
    {{- line.unit_price | unit_price_with_measurement: line.unit_price_measurement -}}
  </div>
{% endif %}
            {% else %}
              חינם
            {% endif %}
          </p>
        </td>
    </table>
  </td>
</tr>
      {% endunless %}
    {% endfor %}
</table>

{% if legacy_separator %}
  <hr class="order-list__delivery-method-type-separator">
{% endif %}

{% for delivery_agreement in delivery_agreements %}
  {% if delivery_agreement.line_items != blank %}
    {% if delivery_agreements.size > 1 %}
      <h4 class="order-list__delivery-method-type">
        פריטי {{ delivery_agreement.delivery_method_name }}
      </h4>
    {% endif %}

    <table class="row">
      {% for line in delivery_agreement.line_items %}
          {% if line.groups.size == 0 %}
            
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.presentment_title %}
          {% assign line_title = line.presentment_title %}
        {% elsif line.title %}
          {% assign line_title = line.title %}
        {% else %}
          {% assign line_title = line.product.title %}
        {% endif %}
        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} of {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' and line.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% elsif line.variant.title != 'Default Title' and line.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.bundle_components %}
            <table>
              <tr class="order-list__item">
                <td class="order-list__bundle-item">
                  <table>
                    <td class="order-list__image-cell">
                      {% if component.image %}
                        <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image small"/>
                      {% else %}
                        <div class="order-list__no-image-cell small">
                          <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                        </div>
                      {% endif %}
                    </td>

                    <td class="order-list__product-description-cell">
                      {% if component.product.title %}
                        {% assign component_title = component.product.title %}
                      {% else %}
                        {% assign component_title = component.title %}
                      {% endif %}

                      {% assign component_display = component.quantity %}

                      <span class="order-list__item-title">{{ component_display }}&nbsp;&times;&nbsp;{{ component_title }}</span><br>

                      {% if component.variant.title != 'Default Title'%}
                        <span class="order-list__item-variant">{{ component.variant.title }}</span>
                      {% endif %}
                    </td>
                  </table>
                </td>
              </tr>
            </table>
          {% endfor %}
        {% else %}
          {% for group in line.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}

          {% if line.gift_card and line.properties["__shopify_send_gift_card_to_recipient"] %}
            {% for property in line.properties %}
  {% assign property_first_char = property.first | slice: 0 %}
  {% if property.last != blank and property_first_char != '_' %}
    <div class="order-list__item-property">
      <dt>{{ property.first }}:</dt>
      <dd>
      {% if property.last contains '/uploads/' %}
        <a href="{{ property.last }}" class="link" target="_blank">
        {{ property.last | split: '/' | last }}
        </a>
      {% else %}
        {{ property.last }}
      {% endif %}
      </dd>
    </div>
  {% endif %}
{% endfor %}

          {% endif %}

        {% if line.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
            <p>
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            </p>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        {% if expand_bundles and line.bundle_parent? %}
          <td class="order-list__parent-price-cell">
        {% else %}
          <td class="order-list__price-cell">
        {% endif %}
        {% if line.original_line_price != line.final_line_price %}
          <del class="order-list__item-original-price">{{ line.original_line_price | money }}</del>
        {% endif %}
          <p class="order-list__item-price">
            {% if line.final_line_price > 0 %}
              {{ line.final_line_price | money }}
              {% if line.unit_price_measurement %}
  <div class="order-list__unit-price">
    {{- line.unit_price | unit_price_with_measurement: line.unit_price_measurement -}}
  </div>
{% endif %}
            {% else %}
              חינם
            {% endif %}
          </p>
        </td>
    </table>
  </td>
</tr>
      {% endunless %}
    {% endfor %}
</table>

{% if legacy_separator %}
  <hr class="order-list__delivery-method-type-separator">
{% endif %}

{% for delivery_agreement in delivery_agreements %}
  {% if delivery_agreement.line_items != blank %}
    {% if delivery_agreements.size > 1 %}
      <h4 class="order-list__delivery-method-type">
        פריטי {{ delivery_agreement.delivery_method_name }}
      </h4>
    {% endif %}

    <table class="row">
      {% for line in delivery_agreement.line_items %}
          {% if line.groups.size == 0 %}
            
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.presentment_title %}
          {% assign line_title = line.presentment_title %}
        {% elsif line.title %}
          {% assign line_title = line.title %}
        {% else %}
          {% assign line_title = line.product.title %}
        {% endif %}
        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} of {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' and line.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% elsif line.variant.title != 'Default Title' and line.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.bundle_components %}
            <table>
              <tr class="order-list__item">
                <td class="order-list__bundle-item">
                  <table>
                    <td class="order-list__image-cell">
                      {% if component.image %}
                        <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image small"/>
                      {% else %}
                        <div class="order-list__no-image-cell small">
                          <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                        </div>
                      {% endif %}
                    </td>

                    <td class="order-list__product-description-cell">
                      {% if component.product.title %}
                        {% assign component_title = component.product.title %}
                      {% else %}
                        {% assign component_title = component.title %}
                      {% endif %}

                      {% assign component_display = component.quantity %}

                      <span class="order-list__item-title">{{ component_display }}&nbsp;&times;&nbsp;{{ component_title }}</span><br>

                      {% if component.variant.title != 'Default Title'%}
                        <span class="order-list__item-variant">{{ component.variant.title }}</span>
                      {% endif %}
                    </td>
                  </table>
                </td>
              </tr>
            </table>
          {% endfor %}
        {% else %}
          {% for group in line.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}

          {% if line.gift_card and line.properties["__shopify_send_gift_card_to_recipient"] %}
            {% for property in line.properties %}
  {% assign property_first_char = property.first | slice: 0 %}
  {% if property.last != blank and property_first_char != '_' %}
    <div class="order-list__item-property">
      <dt>{{ property.first }}:</dt>
      <dd>
      {% if property.last contains '/uploads/' %}
        <a href="{{ property.last }}" class="link" target="_blank">
        {{ property.last | split: '/' | last }}
        </a>
      {% else %}
        {{ property.last }}
      {% endif %}
      </dd>
    </div>
  {% endif %}
{% endfor %}

          {% endif %}

        {% if line.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
            <p>
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            </p>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        {% if expand_bundles and line.bundle_parent? %}
          <td class="order-list__parent-price-cell">
        {% else %}
          <td class="order-list__price-cell">
        {% endif %}
        {% if line.original_line_price != line.final_line_price %}
          <del class="order-list__item-original-price">{{ line.original_line_price | money }}</del>
        {% endif %}
          <p class="order-list__item-price">
            {% if line.final_line_price > 0 %}
              {{ line.final_line_price | money }}
              {% if line.unit_price_measurement %}
  <div class="order-list__unit-price">
    {{- line.unit_price | unit_price_with_measurement: line.unit_price_measurement -}}
  </div>
{% endif %}
            {% else %}
              חינם
            {% endif %}
          </p>
        </td>
    </table>
  </td>
</tr>
      {% endunless %}
    {% endfor %}
</table>

{% if legacy_separator %}
  <hr class="order-list__delivery-method-type-separator">
{% endif %}

{% for delivery_agreement in delivery_agreements %}
  {% if delivery_agreement.line_items != blank %}
    {% if delivery_agreements.size > 1 %}
      <h4 class="order-list__delivery-method-type">
        פריטי {{ delivery_agreement.delivery_method_name }}
      </h4>
    {% endif %}

    <table class="row">
      {% for line in delivery_agreement.line_items %}
          {% if line.groups.size == 0 %}
            
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.presentment_title %}
          {% assign line_title = line.presentment_title %}
        {% elsif line.title %}
          {% assign line_title = line.title %}
        {% else %}
          {% assign line_title = line.product.title %}
        {% endif %}
        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} of {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' and line.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% elsif line.variant.title != 'Default Title' and line.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.bundle_components %}
            <table>
              <tr class="order-list__item">
                <td class="order-list__bundle-item">
                  <table>
                    <td class="order-list__image-cell">
                      {% if component.image %}
                        <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image small"/>
                      {% else %}
                        <div class="order-list__no-image-cell small">
                          <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                        </div>
                      {% endif %}
                    </td>

                    <td class="order-list__product-description-cell">
                      {% if component.product.title %}
                        {% assign component_title = component.product.title %}
                      {% else %}
                        {% assign component_title = component.title %}
                      {% endif %}

                      {% assign component_display = component.quantity %}

                      <span class="order-list__item-title">{{ component_display }}&nbsp;&times;&nbsp;{{ component_title }}</span><br>

                      {% if component.variant.title != 'Default Title'%}
                        <span class="order-list__item-variant">{{ component.variant.title }}</span>
                      {% endif %}
                    </td>
                  </table>
                </td>
              </tr>
            </table>
          {% endfor %}
        {% else %}
          {% for group in line.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}

          {% if line.gift_card and line.properties["__shopify_send_gift_card_to_recipient"] %}
            {% for property in line.properties %}
  {% assign property_first_char = property.first | slice: 0 %}
  {% if property.last != blank and property_first_char != '_' %}
    <div class="order-list__item-property">
      <dt>{{ property.first }}:</dt>
      <dd>
      {% if property.last contains '/uploads/' %}
        <a href="{{ property.last }}" class="link" target="_blank">
        {{ property.last | split: '/' | last }}
        </a>
      {% else %}
        {{ property.last }}
      {% endif %}
      </dd>
    </div>
  {% endif %}
{% endfor %}

          {% endif %}

        {% if line.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
            <p>
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            </p>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        {% if expand_bundles and line.bundle_parent? %}
          <td class="order-list__parent-price-cell">
        {% else %}
          <td class="order-list__price-cell">
        {% endif %}
        {% if line.original_line_price != line.final_line_price %}
          <del class="order-list__item-original-price">{{ line.original_line_price | money }}</del>
        {% endif %}
          <p class="order-list__item-price">
            {% if line.final_line_price > 0 %}
              {{ line.final_line_price | money }}
              {% if line.unit_price_measurement %}
  <div class="order-list__unit-price">
    {{- line.unit_price | unit_price_with_measurement: line.unit_price_measurement -}}
  </div>
{% endif %}
            {% else %}
              חינם
            {% endif %}
          </p>
        </td>
    </table>
  </td>
</tr>
      {% endunless %}
    {% endfor %}
</table>

{% if legacy_separator %}
  <hr class="order-list__delivery-method-type-separator">
{% endif %}

{% for delivery_agreement in delivery_agreements %}
  {% if delivery_agreement.line_items != blank %}
    {% if delivery_agreements.size > 1 %}
      <h4 class="order-list__delivery-method-type">
        פריטי {{ delivery_agreement.delivery_method_name }}
      </h4>
    {% endif %}

    <table class="row">
      {% for line in delivery_agreement.line_items %}
          {% if line.groups.size == 0 %}
            
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.image %}
            <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.presentment_title %}
          {% assign line_title = line.presentment_title %}
        {% elsif line.title %}
          {% assign line_title = line.title %}
        {% else %}
          {% assign line_title = line.product.title %}
        {% endif %}
        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} of {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' and line.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% elsif line.variant.title != 'Default Title' and line.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.bundle_components %}
            <table>
              <tr class="order-list__item">
                <td class="order-list__bundle-item">
                  <table>
                    <td class="order-list__image-cell">
                      {% if component.image %}
                        <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image small"/>
                      {% else %}
                        <div class="order-list__no-image-cell small">
                          <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="40" height="40" class="order-list__no-product-image small"/>
                        </div>
                      {% endif %}
                    </td>

                    <td class="order-list__product-description-cell">
                      {% if component.product.title %}
                        {% assign component_title = component.product.title %}
                      {% else %}
                        {% assign component_title = component.title %}
                      {% endif %}

                      {% assign component_display = component.quantity %}

                      <span class="order-list__item-title">{{ component_display }}&nbsp;&times;&nbsp;{{ component_title }}</span><br>

                      {% if component.variant.title != 'Default Title'%}
                        <span class="order-list__item-variant">{{ component.variant.title }}</span>
                      {% endif %}
                    </td>
                  </table>
                </td>
              </tr>
            </table>
          {% endfor %}
        {% else %}
          {% for group in line.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}

          {% if line.gift_card and line.properties["__shopify_send_gift_card_to_recipient"] %}
            {% for property in line.properties %}
  {% assign property_first_char = property.first | slice: 0 %}
  {% if property.last != blank and property_first_char != '_' %}
    <div class="order-list__item-property">
      <dt>{{ property.first }}:</dt>
      <dd>
      {% if property.last contains '/uploads/' %}
        <a href="{{ property.last }}" class="link" target="_blank">
        {{ property.last | split: '/' | last }}
        </a>
      {% else %}
        {{ property.last }}
      {% endif %}
      </dd>
    </div>
  {% endif %}
{% endfor %}

          {% endif %}

        {% if line.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
            <p>
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            </p>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        {% if expand_bundles and line.bundle_parent? %}
          <td class="order-list__parent-price-cell">
        {% else %}
          <td class="order-list__price-cell">
        {% endif %}
        {% if line.original_line_price != line.final_line_price %}
          <del class="order-list__item-original-price">{{ line.original_line_price | money }}</del>
        {% endif %}
          <p class="order-list__item-price">
            {% if line.final_line_price > 0 %}
              {{ line.final_line_price | money }}
              {% if line.unit_price_measurement %}
  <div class="order-list__unit-price">
    {{- line.unit_price | unit_price_with_measurement: line.unit_price_measurement -}}
  </div>
{% endif %}
            {% else %}
              חינם
            {% endif %}
          </p>
        </td>
    </table>
  </td>
</tr>
      {% endunless %}
    {% endfor %}
</table>

          <table class="row section">
  <tr>
    <td class="section__cell">
      <center>
        <table class="container">
          <tr>
            <td>
              <h3>פרטי לקוח</h3>
            </td>
          </tr>
        </table>
        <table class="container">
          <tr>
            <td>
              
            <table class="row">
              <tr>
                {% if requires_shipping and shipping_address %}
                  <td class="customer-info__item">
                    <h4>כתובת משלוח</h4>
                    {{ shipping_address | format_address }}
                  </td>
                {% endif %}
                {% if billing_address %}
                  <td class="customer-info__item">
                    <h4>כתובת חיוב</h4>
                    {{ billing_address | format_address }}
                  </td>
                {% endif %}
              </tr>
            </table>
            <table class="row">
              <tr>
                {% if company_location %}
                  <td class="customer-info__item">
                    <h4>מיקום</h4>
                    <p>
                      {{ company_location.name }}
                    </p>
                  </td>
                {% endif %}
                {% if transaction_size > 0 or payment_terms and payment_terms.automatic_capture_at_fulfillment == false or b2b? %}
                  <td class="customer-info__item">
                    <h4>תשלום</h4>
                    <p class="customer-info__item-content">
                      {% if payment_terms %}
                        {% assign due_date = payment_terms.next_payment.due_at | default: nil %}
                        {% if payment_terms.type == 'receipt' or payment_terms.type == 'fulfillment' and payment_terms.next_payment.due_at == nil %}
                          {{ payment_terms.translated_name }}<br>
                        {% else %}
                          {{ payment_terms.translated_name }}: Due {{ due_date | date: format: 'date' }}<br>
                        {% endif %}
                      {% endif %}
                      {% if transaction_size > 0 %}
                        {% for transaction in transactions %}
                          {% if transaction.status == "success" or transaction.status == "pending" %}
                            {% if transaction.kind == "capture" or transaction.kind == "sale" %}
                              {% if transaction.payment_details.gift_card_last_four_digits %}
                                <img src="{{ transaction.payment_details.type | downcase | replace: '_', '-'  | payment_type_img_url }}" class="customer-info__item-credit" height="24">
                                ending with {{ transaction.payment_details.gift_card_last_four_digits }}<br>
                              {% elsif transaction.payment_details.type == "shop_pay_installments" and transaction.payment_details.credit_card_company == "unknown" %}
                                <img src="{{ 'notifications/shop-pay.svg' | shopify_asset_url  }}" class="customer-info__item-shop-pay">
                                <br>
                                <span>Paid with Shop Pay installments</span><br>
                              {% elsif transaction.payment_details.credit_card_company %}
                                <img src="{{ transaction.payment_details.credit_card_company | payment_icon_png_url  }}" class="customer-info__item-credit" height="24" alt="{{ transaction.payment_details.credit_card_company }}">
                                <span>ending with {{ transaction.payment_details.credit_card_last_four_digits }}</span><br>
                              {% elsif transaction.gateway_display_name == "Gift card" %}
                                <img src="{{ transaction.gateway_display_name | downcase | replace: ' ', '-'  | payment_type_img_url }}" class="customer-info__item-credit" height="24">
                                ending with {{ transaction.payment_details.gift_card.last_four_characters | upcase }}<br>
                                  &emsp;&emsp;&emsp;&nbsp;יתרת כרטיס מתנה - <b>{{ transaction.payment_details.gift_card.balance |  money }}</b>
                              {% elsif transaction.gateway_display_name != "Shop Cash" and transaction.gateway != "shop_offer" %}
                                {{ transaction.gateway_display_name }}<br>
                              {% endif %}
                            {% elsif transaction.kind == "authorization" and transaction.gateway_display_name == "Shop Cash" %}
                              <span>Shop Cash</span><br>
                            {% endif %}
                          {% endif %}
                        {% endfor %}
                      {% endif %}
                    </p>
                  </td>
                {% endif %}
              </tr>
              <tr>
                {% if requires_shipping and shipping_address %}
                  {% if shipping_method %}
                    <td class="customer-info__item">
                      <h4>שיטת משלוח</h4>
                        <p>
                          {% if delivery_promise_branded_shipping_line %}
                            {{ delivery_promise_branded_shipping_line }}
                          {% else %}
                            {{ shipping_method.title }}
                          {% endif %}
                        </p>
                    </td>
                  {% endif %}
                {% endif %}
              </tr>
            </table>

            </td>
          </tr>
        </table>
      </center>
    </td>
  </tr>
</table>

          <table class="row footer">
  <tr>
    <td class="footer__cell">
      <center>
        <table class="container">
          <tr>
            <td>
              
              <p class="disclaimer__subtext">אם יש לך שאלות, השב למייל הזה או צור קשר איתנו ב <a href="mailto:{{ shop.email }}">{{ shop.email }}</a></p>
            </td>
          </tr>
        </table>
      </center>
    </td>
  </tr>
</table>

<img src="{{ 'notifications/spacer.png' | shopify_asset_url }}" class="spacer" height="1" />

        </td>
      </tr>
    </table>
  </body>
</html>

{%- if billing_address.country_code == 'DE' or billing_address.country_code == 'DK' -%}
  {%- if shop.terms_of_service.body != blank -%}
    {{ shop.terms_of_service | attach_as_pdf: "Terms of service" }}
  {%- endif -%}

  {%- if shop.refund_policy.body != blank -%}
    {{ shop.refund_policy | attach_as_pdf: "Refund policy" }}
  {%- endif -%}
{%- endif -%}
`,
  },
];
