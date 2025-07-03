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
      {% endcase %}{%  %}
        {% if delivery_instructions != blank  %}
          <p><b>הור{%  %} משלוח:</b> {{ delivery_instructions }}</p>
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
  {% if found_gift_{%  %}d_with_recipient_email %}
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

    {% endfor %}
  </table>

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

          {% endif %}
      {% endfor %}
    </table>

    {% unless forloop.last %}
      <hr class="order-list__delivery-method-type-separator">
    {% endunless %}
  {% endif %}
{% endfor %}

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

  {
    id: "draft_order_invoice",
    title: "חשבונית טיוטת הזמנה",
    subject: `חשבונית {{name}}`,
    body: `{% capture email_title %}
  {% if payment_terms %}
    סקור ואשר להשלמת ההזמנה
  {% else %}
    השלם את הרכישה שלך
  {% endif %}
{% endcapture %}
{% capture email_body %}
  {% if item_count > 1 %}
    הפריטים האלה יישמרו עבורך עד {{ reserve_inventory_until | date: format: 'date_at_time' }}.
  {% else %}
    הפריט הזה יישמר עבורך עד {{ reserve_inventory_until | date: format: 'date_at_time' }}.
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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
                              חשבונית {{ name }}
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
            {% if custom_message != blank %}
              <p>{{ custom_message }}</p>
            {% elsif reserve_inventory_until %}
              <p>{{ email_body }}</p>
            {% endif %}
            {% if payment_terms %}
              <table class="row actions">
  <tr>
    <td class="empty-line">&nbsp;</td>
  </tr>
  <tr>
    <td class="actions__cell">
      <table class="button main-action-cell">
        <tr>
          <td class="button__cell"><a href="{{ invoice_url }}" class="button__text">אשר הזמנה</a></td>
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
              <table class="row actions">
  <tr>
    <td class="empty-line">&nbsp;</td>
  </tr>
  <tr>
    <td class="actions__cell">
      <table class="button main-action-cell">
        <tr>
          <td class="button__cell"><a href="{{ invoice_url }}" class="button__text">השלם את הרכישה שלך</a></td>
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
              
            
  <table class="row">
    {% for line in subtotal_line_items %}
      
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = true %}

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

    {% endfor %}
  </table>

            <table class="row subtotal-lines">
  <tr>
    <td class="subtotal-spacer"></td>
    <td>
      <table class="row subtotal-table">

        
{% assign order_discount_count = 0 %}
{% assign total_order_discount_amount = 0 %}
{% assign subtotal_order_amount = 0 %}
{% assign has_shipping_discount = false %}

{% for discount_application in discount_applications %}
  {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
    {% assign order_discount_count = order_discount_count | plus: 1 %}
    {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount  %}
    {% assign subtotal_order_amount = subtotal_order_amount | plus: discount_application.total_allocated_amount  %}
  {% endif %}
  {% if discount_application.target_type == 'shipping_line' %}
    {% assign has_shipping_discount = true %}
    {% assign shipping_discount = discount_application.title %}
    {% assign shipping_amount = discount_application.total_allocated_amount %}
    {% assign subtotal_order_amount = subtotal_order_amount | plus: discount_application.total_allocated_amount  %}
    {% assign discounted_shipping_price = shipping_price | minus: shipping_amount %}
  {% endif %}
{% endfor %}



<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ביניים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ subtotal_price | plus: subtotal_order_amount | money }}</strong>
  </td>
</tr>



{% if order_discount_count > 0 %}
  {% if order_discount_count == 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחת הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% else %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחות הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% for discount_application in discount_applications %}
    {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
      <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
        </span>
      </span>
    </p>
  </td>
</tr>

    {% endif %}
  {% endfor %}
{% endif %}


        {% if delivery_method == 'pick-up' %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>איסוף</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

        {% else %}
          {% if has_shipping_discount %}
  {% if discounted_shipping_price > 0 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ discounted_shipping_price | money }}</strong>
  </td>
</tr>

    <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ shipping_discount }} (-{{ shipping_amount | money }})
        </span>
      </span>
    </p>
  </td>
</tr>

  {% else %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>חינם</strong>
  </td>
</tr>

    <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ shipping_discount }} (-{{ shipping_amount | money }})
        </span>
      </span>
    </p>
  </td>
</tr>

  {% endif %}
{% else %}
  
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

{% endif %}

        {% endif %}

        {% if total_duties %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מכס</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_duties | money }}</strong>
  </td>
</tr>

        {% endif %}

        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מס משוער</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ tax_price | money }}</strong>
  </td>
</tr>


        {% if total_tip and total_tip > 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>טיפ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_tip | money }}</strong>
  </td>
</tr>

        {% endif %}
      </table>

      <table class="row subtotal-table subtotal-table--total">
      {% if payment_terms %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום היום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ amount_due_now | money_with_currency }}</strong>
  </td>
</tr>

        <div class="payment-terms">
          {% assign next_payment = payment_terms.next_payment %}
          {% assign due_at_date = next_payment.due_at | date: format: 'date' %}
          {% assign next_amount_due = total_price | minus: amount_due_now %}

          {% if payment_terms.type == 'receipt' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם הקבלה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% elsif payment_terms.type == 'fulfillment' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם המילוי</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% else %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום {{ due_at_date }}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% endif %}
        </div>
      {% else %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

      {% endif %}
      </table>

      {% if total_discounts > 0 %}
        <p class="total-discount">
          חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
        </p>
      {% endif %}

      {% unless payment_terms %}


      {% endunless %}
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

          {% if shipping_address or billing_address or shipping_method or company_location or payment_terms %}
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
                  {% if shipping_address %}
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
              {% if shipping_method or company_location or payment_terms %}
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

                    {% if payment_terms %}
                      <td class="customer-info__item">
                        <h4>תשלום</h4>
                        {% assign due_date = payment_terms.next_payment.due_at | default: nil %}
                        {% if payment_terms.type == 'receipt' or payment_terms.type == 'fulfillment' %}
                          <p>{{ payment_terms.translated_name }}</p>
                        {% else %}
                          <p>{{ payment_terms.translated_name }}: תאריך פירעון {{ due_date | date: format: 'date' }}</p>
                        {% endif %}
                      </td>
                    {% endif %}
                  </tr>
                  <tr>
                    {% if shipping_method %}
                      <td class="customer-info__item customer-info__item--last">
                        <h4>שיטת משלוח</h4>
                        {% if local_pickup %}
                          <p>איסוף עצמי - {{ shipping_method.title }}</p>
                          {% if local_pickup_address %}
                            {{ local_pickup_address | format_address }}
                          {% endif %}
                        {% else %}
                          <p>{{ shipping_method.title }}<br/>{{ shipping_method.price | money }}</p>
                        {% endif %}
                      </td>
                      <td class="customer-info__item customer-info__item--last">
                      </td>
                    {% endif %}
                  </tr>
                </table>
              {% endif %}

            </td>
          </tr>
        </table>
      </center>
    </td>
  </tr>
</table>
          {% endif %}

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
`,
  },

  {
    id: "shipping_confirmation",
    title: "אישור משלוח",
    subject: `משלוח מהזמנה {{ name }} בדרך`,
    body: `{% if fulfillment.item_count == item_count %} 
  {% capture email_title %}ההזמנה שלך בדרך{% endcapture %}
  {% capture email_body %}ההזמנה שלך בדרך. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
{% elsif fulfillment.item_count > 1 %} 
  {% if fulfillment_status == 'fulfilled' %}
    {% capture email_title %}הפריטים האחרונים בהזמנה שלך בדרך{% endcapture %}
    {% capture email_body %}הפריטים האחרונים בהזמנה שלך בדרך. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
  {% else %}
    {% capture email_title %}חלק מהפריטים בהזמנה שלך בדרך{% endcapture %}
    {% capture email_body %}חלק מהפריטים בהזמנה שלך בדרך. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
  {% endif %}
{% else %} 
  {% if fulfillment_status == 'fulfilled' %}
    {% capture email_title %}הפריט האחרון בהזמנה שלך בדרך{% endcapture %}
    {% capture email_body %}הפריט האחרון בהזמנה שלך בדרך. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
  {% else %}
    {% capture email_title %}פריט אחד מההזמנה שלך בדרך{% endcapture %}
    {% capture email_body %}פריט אחד מההזמנה שלך בדרך. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
  {% endif %}
{% endif %}

{% capture email_emphasis %}תאריך אספקה משוער: <strong>{{fulfillment.estimated_delivery_at | date: format: 'date'}}</strong>{% endcapture %}

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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
            {% if fulfillment.estimated_delivery_at %}
              <p>{{ email_emphasis }}</p>
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
            {% if fulfillment.tracking_numbers.size > 0 %}
  <p class="disclaimer__subtext">
    <br/>
    {% if fulfillment.tracking_numbers.size == 1 and fulfillment.tracking_company and fulfillment.tracking_url %}
      מספר מעקב {{ fulfillment.tracking_company }}: <a href="{{ fulfillment.tracking_url }}">{{ fulfillment.tracking_numbers.first }}</a>
    {% elsif fulfillment.tracking_numbers.size == 1 %}
      מספר מעקב: {{ fulfillment.tracking_numbers.first }}
    {% else %}
      מספרי מעקב {{ fulfillment.tracking_company }}:<br />
      {% for tracking_number in fulfillment.tracking_numbers %}
        {% if fulfillment.tracking_urls[forloop.index0] %}
          <a href="{{ fulfillment.tracking_urls[forloop.index0] }}">
            {{ tracking_number }}
          </a>
        {% else %}
            {{ tracking_number }}
        {% endif %}
        <br/>
      {% endfor %}
    {% endif %}
  </p>
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
              <h3>פריטים במשלוח הזה</h3>
            </td>
          </tr>
        </table>
        <table class="container">
          <tr>
            <td>
              
            
  <table class="row">
    {% for line in fulfillment.fulfillment_line_items %}
      
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.line_item.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.line_item.presentment_title %}
          {% assign line_title = line.line_item.presentment_title %}
        {% elsif line.line_item.title %}
          {% assign line_title = line.line_item.title %}
        {% else %}
          {% assign line_title = line.line_item.product.title %}
        {% endif %}
        {% if line.quantity < line.line_item.quantity %}
          {% capture line_display %}
            {{ line.quantity }} מתוך {{ line.line_item.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.line_item.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% elsif line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.line_item.bundle_components %}
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
          {% for group in line.line_item.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}


        {% if line.line_item.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.line_item.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.line_item.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.line_item.discount_allocations %}
          {% for discount_allocation in line.line_item.discount_allocations %}
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
    </table>
  </td>
</tr>

    {% endfor %}
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
`,
  },

  {
    id: "ready_for_local_pickup",
    title: "מוכן לאיסוף עצמי",
    subject: `חבילה מהזמנה {{ name }} מוכנה לאיסוף`,
    body: `{% if prepared_package.item_count == item_count %} 
  {% capture email_title %}ההזמנה שלך מוכנה לאיסוף{% endcapture %}
{% else %} 
  {% capture email_title %}חלק מהפריטים בהזמנה שלך מוכנים לאיסוף{% endcapture %}
{% endif %}

{% capture email_body %}הבא את מייל האישור כשתגיע לאסוף את ההזמנה שלך.{% endcapture %}

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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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

            {% if pickup_instructions != blank %}
              <p>{{ pickup_instructions }}</p>
            {% else %}
              <p>{{ email_body }}</p>
            {% endif %}

            <table class="section--margin">
  <tr>
    <td>
      <h4>מיקום איסוף</h4>
    </td>
  </tr>
  <tr>
    <td>
      <p>{{ location.name }}</p>
    </td>
  </tr>
  <tr>
    <td>
      <p>{{ location.address1 }}</p>
    </td>
  </tr>
  {% if location.address2 != blank %}
  <tr>
    <td>
      <p>{{ location.address2 }}</p>
    </td>
  </tr>
  {% endif %}
  <tr>
    <td>
      <p>{{ location.city | capitalize }} {{ location.province | capitalize }} {{ location.zip | upcase }}</p>
    </td>
  </tr>
  <tr>
    <td class="empty-line">&nbsp;</td>
  </tr>
  <tr>
    <td>
      <a href="http://www.google.com/maps/search/?api=1&query={{ location.name }} - {{ [location.address1, location.address2].compact.join(', ') }}, {{ location.city }}, {{ location.province }}, {{ location.zip }}" target="_blank">
        פתח מפה&nbsp;
        <span class="small">&larr;</span>
      </a>
    </td>
  </tr>
</table>


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

          {% if prepared_package.item_count != item_count %}
            <table class="row section">
  <tr>
    <td class="section__cell">
      <center>
        <table class="container">
          <tr>
            <td>
              <h3>פריטים מוכנים לאיסוף</h3>
            </td>
          </tr>
        </table>
        <table class="container">
          <tr>
            <td>
              
              
  <table class="row">
    {% for line in prepared_package.prepared_package_line_items %}
      
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.line_item.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.line_item.presentment_title %}
          {% assign line_title = line.line_item.presentment_title %}
        {% elsif line.line_item.title %}
          {% assign line_title = line.line_item.title %}
        {% else %}
          {% assign line_title = line.line_item.product.title %}
        {% endif %}
        {% if line.quantity < line.line_item.quantity %}
          {% capture line_display %}
            {{ line.quantity }} מתוך {{ line.line_item.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.line_item.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% elsif line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.line_item.bundle_components %}
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
          {% for group in line.line_item.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}


        {% if line.line_item.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.line_item.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.line_item.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.line_item.discount_allocations %}
          {% for discount_allocation in line.line_item.discount_allocations %}
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
    </table>
  </td>
</tr>

    {% endfor %}
  </table>


            </td>
          </tr>
        </table>
      </center>
    </td>
  </tr>
</table>
          {% endif %}

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
              
            
  <table class="row">
    {% for line in subtotal_line_items %}
      
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
            {{ line.quantity }} מתוך {{ line.quantity }}
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

    {% endfor %}
  </table>

            <table class="row subtotal-lines">
  <tr>
    <td class="subtotal-spacer"></td>
    <td>
      <table class="row subtotal-table">

        
{% assign total_order_discount_amount = 0 %}
{% assign has_shipping_discount = false %}
{% assign epsilon = 0.00001 %}

{% for discount_application in discount_applications %}
  {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
    {% assign order_discount_count = order_discount_count | plus: 1 %}
    {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount %}
  {% endif %}
  {% if discount_application.target_type == 'shipping_line' %}
    {% assign has_shipping_discount = true %}
    {% assign shipping_discount_title = discount_application.title %}
    {% assign discount_value_price = discount_application.total_allocated_amount %}
    {% assign shipping_amount_minus_discount_value_price = shipping_price | minus: discount_value_price %}
    {% assign shipping_amount_minus_discount_value_price_abs = shipping_amount_minus_discount_value_price | abs %}
    {% assign discount_application_value_type = discount_application.value_type | strip %}
    {% if shipping_amount_minus_discount_value_price_abs < epsilon or discount_application_value_type == 'percentage' and discount_application.value == 100 %}
      {% assign free_shipping = true %}
    {% else %}
      {% assign discounted_shipping_price = shipping_amount_minus_discount_value_price %}
    {% endif %}
  {% endif %}
{% endfor %}



<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ביניים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ subtotal_price | plus: total_order_discount_amount | money }}</strong>
  </td>
</tr>



{% if order_discount_count > 0 %}
  {% if order_discount_count == 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחת הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% if order_discount_count > 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחות הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% for discount_application in discount_applications %}
    {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
      <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
        </span>
      </span>
    </p>
  </td>
</tr>

    {% endif %}
  {% endfor %}
{% endif %}


        {% unless retail_delivery_only %}
          {% if delivery_method == 'pick-up' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>איסוף</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

          {% else %}
            {% if has_shipping_discount %}
  {% if free_shipping == true %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{% if shipping_price != 0 %}{{ shipping_price | money}}{% endif %} </del>
      <strong>חינם</strong>
  </td>
</tr>

  {% else %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{{ shipping_price | money }} </del>
      <strong>{{ discounted_shipping_price | money }}</strong>
  </td>
</tr>

  {% endif %}
  <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ shipping_discount_title }} 
            {% if discount_value_price != 0 %}
              (-{{ discount_value_price | money }})
            {% endif %}
        </span>
      </span>
    </p>
  </td>
</tr>

{% else %}
  
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

{% endif %}

          {% endif %}
        {% endunless %}

        {% if total_duties %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מכס</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_duties | money }}</strong>
  </td>
</tr>

        {% endif %}

        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מסים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ tax_price | money }}</strong>
  </td>
</tr>


        {% if total_tip and total_tip > 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>טיפ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_tip | money }}</strong>
  </td>
</tr>

        {% endif %}
      </table>

      {% assign transaction_size = 0 %}
      {% assign transaction_amount = 0 %}
      {% assign net_transaction_amount_rounding = 0 %}
      {% assign authorized_amount = 0 %}
      {% assign has_refunds = false %}
      {% assign shopify_pay_captured = false %}
      {% assign shop_cash_offers_captured = false %}
      {% for transaction in transactions %}
        {% if transaction.status == "success" %}
          {% if transaction.kind == "sale" or transaction.kind == "capture"  %}
              {% if transaction.payment_details.credit_card_company %}
                {% assign shopify_pay_captured = true %}
              {% endif %}
              {% if transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                {% assign shop_cash_offers_captured = true %}
              {% endif %}
              {% assign transaction_size = transaction_size | plus: 1 %}
              {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
              {% if transaction.amount_rounding != nil %}
                {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
              {% endif %}
          {% elsif transaction.kind == "refund" or transaction.kind == "change" %}
            {% assign transaction_size = transaction_size | plus: 1 %}
            {% assign transaction_amount = transaction_amount | minus: transaction.amount %}
            {% assign has_refunds = true %}
            {% if transaction.amount_rounding != nil %}
              {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | minus: transaction.amount_rounding %}
            {% endif %}
          {% elsif transaction.kind == "authorization" %}
            {% assign authorized_amount = authorized_amount | plus: transaction.amount %}
          {% endif %}
        {% endif %}
      {% endfor %}

      {% # Add shop cash/offer transactions to totals if shopify pay is captured and shop cash/offer is not captured yet %}
      {% if shopify_pay_captured == true and shop_cash_offers_captured == false %}
        {% for transaction in transactions %}
        {% if transaction.status == "success" %}
          {% if transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
              {% assign transaction_size = transaction_size | plus: 1 %}
              {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
              {% if transaction.amount_rounding != nil %}
                {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
              {% endif %}
          {% endif %}
        {% endif %}
      {% endfor %}
      {% endif %}
      <table class="row subtotal-table subtotal-table--total">
      {% if payment_terms and payment_terms.automatic_capture_at_fulfillment == false or b2b? %}
        {% assign next_payment = payment_terms.next_payment %}
        {% assign due_at_date = next_payment.due_at | date: "%b %d, %Y" %}
        {% if net_transaction_amount_rounding != 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

          {% if total_discounts > 0 %}
            <tr class="subtotal-line">
              <td></td>
              <td class="subtotal-line__value total-discount">
                  חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
              </td>
            </tr>
          {% endif %}
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <div class="subtotal-line__value-small">
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>עיגול מזומן</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
  </td>
</tr>

          </div>
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
        {% endif %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ששולם היום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

        <div class="payment-terms">
          {% assign next_amount_due = total_price %}
          {% if next_payment %}
            {% assign next_amount_due = next_payment.amount_due %}
          {% elsif total_outstanding > 0 %}
            {% assign next_amount_due = total_outstanding %}
          {% endif %}

          {% if payment_terms.type == 'receipt' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם הקבלה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% elsif payment_terms.type == 'fulfillment' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם המילוי</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% else %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום {{ due_at_date }}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% endif %}
        </div>
        {% if total_discounts > 0 and net_transaction_amount_rounding == 0 %}
          <tr class="subtotal-line">
            <td></td>
            <td class="subtotal-line__value total-discount">
                חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
            </td>
          </tr>
        {% endif %}
      {% else %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

        {% if total_discounts > 0 %}
          <tr class="subtotal-line">
            <td></td>
            <td class="subtotal-line__value total-discount">
                חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
            </td>
          </tr>
        {% endif %}
        {% if net_transaction_amount_rounding != 0 %}
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <div class="subtotal-line__value-small">
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>עיגול מזומן</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
  </td>
</tr>

          </div>
          {% if financial_status == 'paid' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>שולם</span>
        <br>
        <small>{{ order.transactions | map: 'gateway_display_name' | uniq | join: ', ' }}</small>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

          {% endif %}
        {% endif %}
        {% if transaction_amount != total_price and payment_terms == nil%}
          {% if transaction_amount == 0 and authorized_amount > 0 and has_refunds == false %}
          {% else %}
            <div class="payment-terms">
              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ששולם היום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

            </div>
          {% endif %}
        {% endif %}
      {% endif %}
      </table>

      {% unless payment_terms %}
      {% if transaction_size > 1 or transaction_amount < total_price %}
        <table class="row subtotal-table">
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <tr><td colspan="2" class="subtotal-table__small-space"></td></tr>

          {% for transaction in transactions %}
            {% assign amount_rounding = 0 %}
            {% if transaction.amount_rounding != 0 %}
              {% assign amount_rounding =  transaction.amount_rounding %}
            {% endif %}
            {% if transaction.status == "success" and transaction.kind == "capture" or transaction.kind == "sale" %}
              {% if transaction.payment_details.gift_card_last_four_digits %}
                {% capture transaction_name %}כרטיס מתנה (מסתיים ב {{ transaction.payment_details.gift_card_last_four_digits }}){% endcapture %}
              {% elsif transaction.payment_details.credit_card_company %}
                {% capture transaction_name %}{{ transaction.payment_details.credit_card_company }} (מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }}){% endcapture %}
              {% else %}
                {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}
              {% endif %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{transaction_name}}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% elsif shopify_pay_captured and shop_cash_offers_captured == false and transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
              {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{transaction_name}}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% endif %}
            {% if transaction.kind == 'refund' and transaction.gateway != "shop_offer" %}
              {% if transaction.payment_details.gift_card_last_four_digits %}
                {% assign refund_method_title = transaction.payment_details.type %}
              {% elsif transaction.payment_details.credit_card_company %}
                {% assign refund_method_title = transaction.payment_details.credit_card_company %}
              {% else %}
                {% assign refund_method_title = transaction.gateway_display_name %}
              {% endif %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>החזר</span>
        <br>
        <small>{{ refund_method_title | replace: '_', ' ' | capitalize }}</small>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>- {{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% endif %}
          {% endfor %}
        </table>
      {% endif %}


      {% endunless %}
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
`,
  },
  {
    id: "picked_up_by_customer",
    title: "נאסף על ידי הלקוח",
    subject: `ההזמנה שלך נאספה ({{ name }})`,
    body: `{% capture email_title %}ההזמנה שלך נאספה{% endcapture %}
{% capture email_body %}תודה שקנית אצל {{ shop_name }}{% endcapture %}

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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
              
            
  <table class="row">
    {% for line in subtotal_line_items %}
      
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
            {{ line.quantity }} מתוך {{ line.quantity }}
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

    {% endfor %}
  </table>

            <table class="row subtotal-lines">
  <tr>
    <td class="subtotal-spacer"></td>
    <td>
      <table class="row subtotal-table">

        
{% assign total_order_discount_amount = 0 %}
{% assign has_shipping_discount = false %}
{% assign epsilon = 0.00001 %}

{% for discount_application in discount_applications %}
  {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
    {% assign order_discount_count = order_discount_count | plus: 1 %}
    {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount %}
  {% endif %}
  {% if discount_application.target_type == 'shipping_line' %}
    {% assign has_shipping_discount = true %}
    {% assign shipping_discount_title = discount_application.title %}
    {% assign discount_value_price = discount_application.total_allocated_amount %}
    {% assign shipping_amount_minus_discount_value_price = shipping_price | minus: discount_value_price %}
    {% assign shipping_amount_minus_discount_value_price_abs = shipping_amount_minus_discount_value_price | abs %}
    {% assign discount_application_value_type = discount_application.value_type | strip %}
    {% if shipping_amount_minus_discount_value_price_abs < epsilon or discount_application_value_type == 'percentage' and discount_application.value == 100 %}
      {% assign free_shipping = true %}
    {% else %}
      {% assign discounted_shipping_price = shipping_amount_minus_discount_value_price %}
    {% endif %}
  {% endif %}
{% endfor %}



<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ביניים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ subtotal_price | plus: total_order_discount_amount | money }}</strong>
  </td>
</tr>



{% if order_discount_count > 0 %}
  {% if order_discount_count == 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחת הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% if order_discount_count > 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחות הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% for discount_application in discount_applications %}
    {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
      <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
        </span>
      </span>
    </p>
  </td>
</tr>

    {% endif %}
  {% endfor %}
{% endif %}


        {% unless retail_delivery_only %}
          {% if delivery_method == 'pick-up' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>איסוף</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

          {% else %}
            {% if has_shipping_discount %}
  {% if free_shipping == true %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{% if shipping_price != 0 %}{{ shipping_price | money}}{% endif %} </del>
      <strong>חינם</strong>
  </td>
</tr>

  {% else %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{{ shipping_price | money }} </del>
      <strong>{{ discounted_shipping_price | money }}</strong>
  </td>
</tr>

  {% endif %}
  <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ shipping_discount_title }} 
            {% if discount_value_price != 0 %}
              (-{{ discount_value_price | money }})
            {% endif %}
        </span>
      </span>
    </p>
  </td>
</tr>

{% else %}
  
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

{% endif %}

          {% endif %}
        {% endunless %}

        {% if total_duties %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מכס</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_duties | money }}</strong>
  </td>
</tr>

        {% endif %}

        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מסים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ tax_price | money }}</strong>
  </td>
</tr>


        {% if total_tip and total_tip > 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>טיפ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_tip | money }}</strong>
  </td>
</tr>

        {% endif %}
      </table>

      {% assign transaction_size = 0 %}
      {% assign transaction_amount = 0 %}
      {% assign net_transaction_amount_rounding = 0 %}
      {% assign authorized_amount = 0 %}
      {% assign has_refunds = false %}
      {% assign shopify_pay_captured = false %}
      {% assign shop_cash_offers_captured = false %}
      {% for transaction in transactions %}
        {% if transaction.status == "success" %}
          {% if transaction.kind == "sale" or transaction.kind == "capture"  %}
              {% if transaction.payment_details.credit_card_company %}
                {% assign shopify_pay_captured = true %}
              {% endif %}
              {% if transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                {% assign shop_cash_offers_captured = true %}
              {% endif %}
              {% assign transaction_size = transaction_size | plus: 1 %}
              {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
              {% if transaction.amount_rounding != nil %}
                {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
              {% endif %}
          {% elsif transaction.kind == "refund" or transaction.kind == "change" %}
            {% assign transaction_size = transaction_size | plus: 1 %}
            {% assign transaction_amount = transaction_amount | minus: transaction.amount %}
            {% assign has_refunds = true %}
            {% if transaction.amount_rounding != nil %}
              {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | minus: transaction.amount_rounding %}
            {% endif %}
          {% elsif transaction.kind == "authorization" %}
            {% assign authorized_amount = authorized_amount | plus: transaction.amount %}
          {% endif %}
        {% endif %}
      {% endfor %}

      {% # Add shop cash/offer transactions to totals if shopify pay is captured and shop cash/offer is not captured yet %}
      {% if shopify_pay_captured == true and shop_cash_offers_captured == false %}
        {% for transaction in transactions %}
        {% if transaction.status == "success" %}
          {% if transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
              {% assign transaction_size = transaction_size | plus: 1 %}
              {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
              {% if transaction.amount_rounding != nil %}
                {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
              {% endif %}
          {% endif %}
        {% endif %}
      {% endfor %}
      {% endif %}
      <table class="row subtotal-table subtotal-table--total">
      {% if payment_terms and payment_terms.automatic_capture_at_fulfillment == false or b2b? %}
        {% assign next_payment = payment_terms.next_payment %}
        {% assign due_at_date = next_payment.due_at | date: "%b %d, %Y" %}
        {% if net_transaction_amount_rounding != 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

          {% if total_discounts > 0 %}
            <tr class="subtotal-line">
              <td></td>
              <td class="subtotal-line__value total-discount">
                  חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
              </td>
            </tr>
          {% endif %}
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <div class="subtotal-line__value-small">
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>עיגול מזומן</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
  </td>
</tr>

          </div>
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
        {% endif %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ששולם היום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

        <div class="payment-terms">
          {% assign next_amount_due = total_price %}
          {% if next_payment %}
            {% assign next_amount_due = next_payment.amount_due %}
          {% elsif total_outstanding > 0 %}
            {% assign next_amount_due = total_outstanding %}
          {% endif %}

          {% if payment_terms.type == 'receipt' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם הקבלה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% elsif payment_terms.type == 'fulfillment' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם המילוי</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% else %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום {{ due_at_date }}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% endif %}
        </div>
        {% if total_discounts > 0 and net_transaction_amount_rounding == 0 %}
          <tr class="subtotal-line">
            <td></td>
            <td class="subtotal-line__value total-discount">
                חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
            </td>
          </tr>
        {% endif %}
      {% else %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

        {% if total_discounts > 0 %}
          <tr class="subtotal-line">
            <td></td>
            <td class="subtotal-line__value total-discount">
                חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
            </td>
          </tr>
        {% endif %}
        {% if net_transaction_amount_rounding != 0 %}
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <div class="subtotal-line__value-small">
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>עיגול מזומן</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
  </td>
</tr>

          </div>
          {% if financial_status == 'paid' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>שולם</span>
        <br>
        <small>{{ order.transactions | map: 'gateway_display_name' | uniq | join: ', ' }}</small>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

          {% endif %}
        {% endif %}
        {% if transaction_amount != total_price and payment_terms == nil%}
          {% if transaction_amount == 0 and authorized_amount > 0 and has_refunds == false %}
          {% else %}
            <div class="payment-terms">
              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ששולם היום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

            </div>
          {% endif %}
        {% endif %}
      {% endif %}
      </table>

      {% unless payment_terms %}
      {% if transaction_size > 1 or transaction_amount < total_price %}
        <table class="row subtotal-table">
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <tr><td colspan="2" class="subtotal-table__small-space"></td></tr>

          {% for transaction in transactions %}
            {% assign amount_rounding = 0 %}
            {% if transaction.amount_rounding != 0 %}
              {% assign amount_rounding =  transaction.amount_rounding %}
            {% endif %}
            {% if transaction.status == "success" and transaction.kind == "capture" or transaction.kind == "sale" %}
              {% if transaction.payment_details.gift_card_last_four_digits %}
                {% capture transaction_name %}כרטיס מתנה (מסתיים ב {{ transaction.payment_details.gift_card_last_four_digits }}){% endcapture %}
              {% elsif transaction.payment_details.credit_card_company %}
                {% capture transaction_name %}{{ transaction.payment_details.credit_card_company }} (מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }}){% endcapture %}
              {% else %}
                {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}
              {% endif %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{transaction_name}}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% elsif shopify_pay_captured and shop_cash_offers_captured == false and transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
              {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{transaction_name}}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% endif %}
            {% if transaction.kind == 'refund' and transaction.gateway != "shop_offer" %}
              {% if transaction.payment_details.gift_card_last_four_digits %}
                {% assign refund_method_title = transaction.payment_details.type %}
              {% elsif transaction.payment_details.credit_card_company %}
                {% assign refund_method_title = transaction.payment_details.credit_card_company %}
              {% else %}
                {% assign refund_method_title = transaction.gateway_display_name %}
              {% endif %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>החזר</span>
        <br>
        <small>{{ refund_method_title | replace: '_', ' ' | capitalize }}</small>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>- {{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% endif %}
          {% endfor %}
        </table>
      {% endif %}


      {% endunless %}
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
`,
  },

  {
    id: "order_out_for_local_delivery",
    title: "הזמנה יצאה למשלוח מקומי",
    subject: `הזמנה {{ name }} יצאה למשלוח`,
    body: `{% capture email_title %}ההזמנה שלך יצאה למשלוח{% endcapture %}
{% capture email_body %}
    ההזמנה שלך בדרך ותגיע בקרוב.
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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
              <h3>פריטים במשלוח</h3>
            </td>
          </tr>
        </table>
        <table class="container">
          <tr>
            <td>
              
            
  <table class="row">
    {% for line in fulfillment.fulfillment_line_items %}
      
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.line_item.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.line_item.presentment_title %}
          {% assign line_title = line.line_item.presentment_title %}
        {% elsif line.line_item.title %}
          {% assign line_title = line.line_item.title %}
        {% else %}
          {% assign line_title = line.line_item.product.title %}
        {% endif %}
        {% if line.quantity < line.line_item.quantity %}
          {% capture line_display %}
            {{ line.quantity }} מתוך {{ line.line_item.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.line_item.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% elsif line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.line_item.bundle_components %}
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
          {% for group in line.line_item.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}


        {% if line.line_item.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.line_item.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.line_item.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.line_item.discount_allocations %}
          {% for discount_allocation in line.line_item.discount_allocations %}
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
    </table>
  </td>
</tr>

    {% endfor %}
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
`,
  },

  {
    id: "order_locally_delivered",
    title: "הזמנה נמסרה מקומית",
    subject: `הזמנה {{ name }} נמסרה`,
    body: `{% capture email_title %}ההזמנה שלך נמסרה{% endcapture %}
{% capture email_body %}
  לא קיבלת את ההזמנה? <a href="mailto:{{ shop.email }}">דווח לנו</a>.
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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
            <p>{{ email_emphasis }}</p>
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
            {% if fulfillment.tracking_numbers.size > 0 %}
  <p class="disclaimer__subtext">
    <br/>
    {% if fulfillment.tracking_numbers.size == 1 and fulfillment.tracking_company and fulfillment.tracking_url %}
      מספר מעקב {{ fulfillment.tracking_company }}: <a href="{{ fulfillment.tracking_url }}">{{ fulfillment.tracking_numbers.first }}</a>
    {% elsif fulfillment.tracking_numbers.size == 1 %}
      מספר מעקב: {{ fulfillment.tracking_numbers.first }}
    {% else %}
      מספרי מעקב {{ fulfillment.tracking_company }}:<br />
      {% for tracking_number in fulfillment.tracking_numbers %}
        {% if fulfillment.tracking_urls[forloop.index0] %}
          <a href="{{ fulfillment.tracking_urls[forloop.index0] }}">
            {{ tracking_number }}
          </a>
        {% else %}
            {{ tracking_number }}
        {% endif %}
        <br/>
      {% endfor %}
    {% endif %}
  </p>
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
              <h3>פריטים במשלוח</h3>
            </td>
          </tr>
        </table>
        <table class="container">
          <tr>
            <td>
              
            
  <table class="row">
    {% for line in fulfillment.fulfillment_line_items %}
      
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.line_item.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.line_item.presentment_title %}
          {% assign line_title = line.line_item.presentment_title %}
        {% elsif line.line_item.title %}
          {% assign line_title = line.line_item.title %}
        {% else %}
          {% assign line_title = line.line_item.product.title %}
        {% endif %}
        {% if line.quantity < line.line_item.quantity %}
          {% capture line_display %}
            {{ line.quantity }} מתוך {{ line.line_item.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.line_item.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% elsif line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.line_item.bundle_components %}
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
          {% for group in line.line_item.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}


        {% if line.line_item.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.line_item.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.line_item.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.line_item.discount_allocations %}
          {% for discount_allocation in line.line_item.discount_allocations %}
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
    </table>
  </td>
</tr>

    {% endfor %}
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

`,
  },

  {
    id: "order_missed_local_delivery",
    title: "משלוח שהוחמץ",
    subject: `משלוח מהזמנה {{ name }} הוחמץ`,
    body: `{% capture email_title %}מצטערים שהחמצנו אותך{% endcapture %}
{% capture email_body %}
    שלום {{ customer.first_name }}, לא הצלחנו לספק את ההזמנה שלך.
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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
              <p>לתיאום משלוח נוסף, <a href="mailto:{{ shop.email }}">צור איתנו קשר</a>.</p>
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
              <h3>פריטים במשלוח</h3>
            </td>
          </tr>
        </table>
        <table class="container">
          <tr>
            <td>
              
            
  <table class="row">
    {% for line in fulfillment.fulfillment_line_items %}
      
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
        {% assign expand_bundles = false %}

      {% if expand_bundles and line.line_item.bundle_parent? %}
        <td class="order-list__parent-image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% else %}
        <td class="order-list__image-cell">
          {% if line.line_item.image %}
            <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
          {% else %}
            <div class="order-list__no-image-cell">
              <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
            </div>
          {% endif %}
        </td>
      {% endif %}
      <td class="order-list__product-description-cell">
        {% if line.line_item.presentment_title %}
          {% assign line_title = line.line_item.presentment_title %}
        {% elsif line.line_item.title %}
          {% assign line_title = line.line_item.title %}
        {% else %}
          {% assign line_title = line.line_item.product.title %}
        {% endif %}
        {% if line.quantity < line.line_item.quantity %}
          {% capture line_display %}
            {{ line.quantity }} מתוך {{ line.line_item.quantity }}
          {% endcapture %}
        {% else %}
          {% assign line_display = line.line_item.quantity %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% elsif line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? and expand_bundles == false %}
          <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
        {% endif %}

        {% if expand_bundles %}
          {% for component in line.line_item.bundle_components %}
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
          {% for group in line.line_item.groups %}
            <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
          {% endfor %}
        {% endif %}


        {% if line.line_item.selling_plan_allocation %}
          <span class="order-list__item-variant">{{ line.line_item.selling_plan_allocation.selling_plan.name }}</span><br/>
        {% endif %}

        {% if line.line_item.refunded_quantity > 0 %}
          <span class="order-list__item-refunded">הוחזר</span>
        {% endif %}

        {% if line.line_item.discount_allocations %}
          {% for discount_allocation in line.line_item.discount_allocations %}
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
    </table>
  </td>
</tr>

    {% endfor %}
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
`,
  },

  {
    id: "new_gift_card",
    title: "כרטיס מתנה חדש",
    subject: `כרטיס מתנה של {{ shop.name }} בשווי {{ gift_card.initial_value | money_without_trailing_zeros }}{% if gift_card.recipient and gift_card.customer %} מ{% if gift_card.customer.name != blank %}{{ gift_card.customer.name }}{% elsif gift_card.customer.email != blank %}{{ gift_card.customer.email }}{% else %}{{ gift_card.customer.phone }}{% endif %}{% endif %}`,
    body: `{% if gift_card.recipient %}
  {% if gift_card.customer %}
    {% if gift_card.customer.name != blank %}
      {% assign sender_name = gift_card.customer.name %}
    {% elsif gift_card.customer.email != blank %}
      {% assign sender_name = gift_card.customer.email %}
    {% else %}
      {% assign sender_name = gift_card.customer.phone %}
    {% endif %}
  {% else %}
    {% assign sender_name = shop.name %}
  {% endif %}

  {% if gift_card.recipient.nickname != blank %}
    {% assign recipient_name = gift_card.recipient.nickname %}
  {% elsif gift_card.recipient.name != blank %}
    {% assign recipient_name = gift_card.recipient.name %}
  {% else %}
    {% assign recipient_name = gift_card.recipient.email %}
  {% endif %}

  {% capture email_title %}
    שלום {{ recipient_name }}, קיבלת כרטיס מתנה מ{{ sender_name }}.
  {% endcapture %}
{% endif %}

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
    <table align="center" class="body giftcard__body">
      <tr>
        <td class="empty-line">&nbsp;</td>
      </tr>
      <tr>
        <td class="empty-line">&nbsp;</td>
      </tr>
      <tr>
        <td>
          <table class="row content">
  <tr>
    <td class="content__cell">
      <center>
        <table class="container">
          <tr>
            <td>
              
            {% if gift_card.recipient %}
              
{% if shop.email_logo_url %}
  <table align="center" class="giftcard__doubletopmargin">
    <tr>
      <td>
        <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" class="giftcard__logosize" width="{{ shop.email_logo_width }}">
      </td>
    </tr>
  </table>
{% endif %}

  <table align="center" class="row giftcard__topmargin">
    <tr>
      <td class="giftcard__title">{{ email_title }}</td>
    </tr>
  </table>

{% if gift_card.recipient and gift_card.message != blank %}
  <table align="center" class="row giftcard__topmargin">
    <tr>
      <td class="giftcard__message">
        "{{ gift_card.message }}"
      </td>
    </tr>
  </table>
{% endif %}

<table align="center" class="giftcard__topmargin">
  <tr>
    <td class="giftcard__balance">{{ gift_card.initial_value | money_with_currency }}</td>
  </tr>
  {% if gift_card.expires_on %}
    <tr>
      <td class="giftcard__smalltext">
        תוקף עד {{ gift_card.expires_on | date: '%e %B, %Y' }}
      </td>
    </tr>
  {% endif %}
</table>

<table align="center" class="giftcard__doubletopmargin">
  <tr>
    <td>
      <img src="{{ 'gift-card/card.jpg' | shopify_asset_url }}" alt="תמונת כרטיס מתנה" width="240" height="160">
    </td>
  </tr>
</table>

<table align="center" class="row giftcard__topmargin">
  <tr>
    <td class="giftcard__shop_name">{{ shop.name }}</td>
  </tr>
</table>

<table align="center" class="row giftcard__topmargin">
  <tr>
    <td class="giftcard__smalltext">
      השתמש בקוד כרטיס המתנה באתר
    </td>
  </tr>
  <tr>
    <td class="giftcard__code">
      {{ gift_card.code | format_code }}
    </td>
  </tr>
</table>

<table class="row actions">
  <tr>
    <td class="actions__cell">
      <table align="center" class="button">
        <tr>
          <td class="button__cell"><a href="{{ shop.url }}" class="button__text">בקר בחנות המקוונת</a></td>
        </tr>
      </table>
      <table align="center" class="button">
        <tr>
          <td class="link__cell"><a href="{{ gift_card.url }}" class="link__text">צפה ביתרת כרטיס המתנה</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

{% if gift_card.pass_url %}
  <table align="center" class="row">
    <tr>
      <td class="giftcard__textcenter">
        <a href="{{ gift_card.pass_url }}" class="apple-wallet-button">
          <img src="{{ 'gift-card/add-to-apple-wallet.png' | shopify_asset_url }}" alt="הוסף לארנק Apple" width="120" height="40">
        </a>
      </td>
    </tr>
  </table>
{% endif %}

            {% else %}
              
{% if shop.email_logo_url %}
  <table align="center" class="giftcard__doubletopmargin">
    <tr>
      <td>
        <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" class="giftcard__logosize" width="{{ shop.email_logo_width }}">
      </td>
    </tr>
  </table>
{% endif %}


{% if gift_card.recipient and gift_card.message != blank %}
  <table align="center" class="row giftcard__topmargin">
    <tr>
      <td class="giftcard__message">
        "{{ gift_card.message }}"
      </td>
    </tr>
  </table>
{% endif %}

<table align="center" class="giftcard__topmargin">
  <tr>
    <td class="giftcard__balance">{{ gift_card.initial_value | money_with_currency }}</td>
  </tr>
  {% if gift_card.expires_on %}
    <tr>
      <td class="giftcard__smalltext">
        תוקף עד {{ gift_card.expires_on | date: '%e %B, %Y' }}
      </td>
    </tr>
  {% endif %}
</table>

<table align="center" class="giftcard__doubletopmargin">
  <tr>
    <td>
      <img src="{{ 'gift-card/card.jpg' | shopify_asset_url }}" alt="תמונת כרטיס מתנה" width="240" height="160">
    </td>
  </tr>
</table>

<table align="center" class="row giftcard__topmargin">
  <tr>
    <td class="giftcard__shop_name">{{ shop.name }}</td>
  </tr>
</table>

<table align="center" class="row giftcard__topmargin">
  <tr>
    <td class="giftcard__smalltext">
      השתמש בקוד כרטיס המתנה באתר
    </td>
  </tr>
  <tr>
    <td class="giftcard__code">
      {{ gift_card.code | format_code }}
    </td>
  </tr>
</table>

<table class="row actions">
  <tr>
    <td class="actions__cell">
      <table align="center" class="button">
        <tr>
          <td class="button__cell"><a href="{{ shop.url }}" class="button__text">בקר בחנות המקוונת</a></td>
        </tr>
      </table>
      <table align="center" class="button">
        <tr>
          <td class="link__cell"><a href="{{ gift_card.url }}" class="link__text">צפה ביתרת כרטיס המתנה</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

{% if gift_card.pass_url %}
  <table align="center" class="row">
    <tr>
      <td class="giftcard__textcenter">
        <a href="{{ gift_card.pass_url }}" class="apple-wallet-button">
          <img src="{{ 'gift-card/add-to-apple-wallet.png' | shopify_asset_url }}" alt="הוסף לארנק Apple" width="120" height="40">
        </a>
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
`,
  },

  {
    id: "order_invoice",
    title: "חשבונית הזמנה",
    subject: `חשבונית {{name}}`,
    body: `<!DOCTYPE html>
<html lang="he" dir="rtl">
{% if payment_terms.type == 'fulfillment' and payment_terms.next_payment.due_at == nil %}
  {% assign due_on_fulfilllment_terms = true %}
{% else %}
  {% assign due_on_fulfilllment_terms = false %}
{% endif %}
{% if source_name == 'shopify_draft_order' and financial_status == 'pending' %}
  {% assign order_from_draft = true %}
{% else %}
  {% assign order_from_draft = false %}
{% endif %}
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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
                              חשבונית {{ order_name }}
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
              
        {% if payment_terms.type == 'receipt' and payment_terms.next_payment.due_at == nil %}
          {% assign due_date = 'עכשיו' %}
        {% else %}
          {% assign due_date = payment_terms.next_payment.due_at | default: nil %}
        {% endif %}

        {% if due_on_fulfilllment_terms == true and payment_terms.automatic_capture_at_fulfillment == false or payment_terms.automatic_capture_at_fulfillment == true and order_from_draft == true %}
          <h2>תשלום של {{ order.total_outstanding | money }} נדרש במילוי ההזמנה</h2>
        {% else %}
          <h2>תשלום של {{ order.total_outstanding | money }} נדרש עד {{ due_date | date: format: 'date' }}</h2>
        {% endif %}
        {% if custom_message != blank %}
        <p>{{ custom_message }}</p>
        {% endif %}
        {% if checkout_payment_collection_url %}
        <table class="row actions">
  <tr>
    <td class="actions__cell">
      <table class="button main-action-cell">
        <tr>
          <td class="button__cell"><a href="{{ checkout_payment_collection_url }}" class="button__text">שלם עכשיו</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>

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
              
        {% if line_items_including_zero_quantity == empty or grouped_view == true %}
          
  
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
            {{ line.quantity }} מתוך {{ line.quantity }}
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
  {% for line_item_group in line_item_groups %}
    
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
                      חינם
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

                  {% if line_item_group.deliverable? %}
                    <span class="order-list__item-title">{{ component_title }}&nbsp;&times;&nbsp;{{ component.quantity }}</span><br/>
                  {% else %}
                    <span class="order-list__item-title">{{ component.quantity }}&nbsp;&times;&nbsp;{{ component_title }}</span><br/>
                  {% endif %}

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
  {% endfor %}
</table>

        {% else %}
          
<table class="row">
  {% for line in line_items_including_zero_quantity %}
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
          {% if line.product.title %}
            {% assign line_title = line.product.title %}
          {% else %}
            {% assign line_title = line.title %}
          {% endif %}

          {% if line.quantity < line.quantity %}
            {% capture line_display %}
              {{ line.quantity }} מתוך {{ line.quantity }}
            {% endcapture %}
          {% else %}
            {% assign line_display = line.quantity  %}
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
                          <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image"/>
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

          {% if line.aggregated_update %}
            <span class="order-list__item-update-status">{{line.aggregated_update}}</span>
          {% elsif line.refunded_quantity > 0 %}
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
              {% if line.final_line_price > 0 or line.quantity == 0 %}
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
  </tr>{% endfor %}
</table>

        {% endif %}
        <table class="row subtotal-lines">
  <tr>
    <td class="subtotal-spacer"></td>
    <td>
      <table class="row subtotal-table">

        
{% assign total_order_discount_amount = 0 %}
{% assign has_shipping_discount = false %}
{% assign epsilon = 0.00001 %}

{% for discount_application in discount_applications %}
  {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
    {% assign order_discount_count = order_discount_count | plus: 1 %}
    {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount %}
  {% endif %}
  {% if discount_application.target_type == 'shipping_line' %}
    {% assign has_shipping_discount = true %}
    {% assign shipping_discount_title = discount_application.title %}
    {% assign discount_value_price = discount_application.total_allocated_amount %}
    {% assign shipping_amount_minus_discount_value_price = shipping_price | minus: discount_value_price %}
    {% assign shipping_amount_minus_discount_value_price_abs = shipping_amount_minus_discount_value_price | abs %}
    {% assign discount_application_value_type = discount_application.value_type | strip %}
    {% if shipping_amount_minus_discount_value_price_abs < epsilon or discount_application_value_type == 'percentage' and discount_application.value == 100 %}
      {% assign free_shipping = true %}
    {% else %}
      {% assign discounted_shipping_price = shipping_amount_minus_discount_value_price %}
    {% endif %}
  {% endif %}
{% endfor %}



<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ביניים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ subtotal_price | plus: total_order_discount_amount | money }}</strong>
  </td>
</tr>



{% if order_discount_count > 0 %}
  {% if order_discount_count == 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחת הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% if order_discount_count > 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחות הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% for discount_application in discount_applications %}
    {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
      <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
        </span>
      </span>
    </p>
  </td>
</tr>

    {% endif %}
  {% endfor %}
{% endif %}


        {% if has_shipping_discount %}
  {% if free_shipping == true %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{% if shipping_price != 0 %}{{ shipping_price | money}}{% endif %} </del>
      <strong>חינם</strong>
  </td>
</tr>

  {% else %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{{ shipping_price | money }} </del>
      <strong>{{ discounted_shipping_price | money }}</strong>
  </td>
</tr>

  {% endif %}
  <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ shipping_discount_title }} 
            {% if discount_value_price != 0 %}
              (-{{ discount_value_price | money }})
            {% endif %}
        </span>
      </span>
    </p>
  </td>
</tr>

{% else %}
  
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

{% endif %}


        {% for fee in fees %}
  
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{ fee.title }}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ fee.subtotal | money }}</strong>
  </td>
</tr>

{% endfor %}

        
        {% if total_duties %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מכס</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_duties | money }}</strong>
  </td>
</tr>

        {% endif %}
        
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מס משוער</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ tax_price | money }}</strong>
  </td>
</tr>


        {% if total_tip_received and total_tip_received > 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>טיפ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_tip_received | money }}</strong>
  </td>
</tr>

        {% endif %}
      </table>
    </td>
  </tr>
</table>

        <table class="row subtotal-lines">
  <tr>
    {% if total_price > total_outstanding %}
    <td class="subtotal-spacer"></td>
      <td>
        <table class="row subtotal-table">
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום מעודכן</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money }}</strong>
  </td>
</tr>

          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>כבר שולם</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ net_payment | money }}</strong>
  </td>
</tr>

        </table>
        <table class="row subtotal-table subtotal-table--total">
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_outstanding | money_with_currency }}</strong>
  </td>
</tr>

        </table>
      </td>
    {% else %}
      <table class="row subtotal-table subtotal-table--total">
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_outstanding | money_with_currency }}</strong>
  </td>
</tr>

      </table>
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

      {% if shipping_address or billing_address or shipping_method or company_location or payment_terms and payment_terms.automatic_capture_at_fulfillment == false %}
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
            {% if shipping_address %}
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

            {% if payment_terms and payment_terms.automatic_capture_at_fulfillment == false %}
            <td class="customer-info__item">
              <h4>תשלום</h4>
              {% if payment_terms.type == 'receipt' and payment_terms.next_payment.due_at == nil %}
                {% assign due_date = 'עכשיו' %}
              {% else %}
                {% assign due_date = payment_terms.next_payment.due_at | default: nil %}
              {% endif %}
              {% if payment_terms.type == 'fulfillment' and payment_terms.next_payment.due_at == nil %}
                <p>{{ payment_terms.translated_name }}</p>
              {% else %}
                <p>{{ payment_terms.translated_name }}: תאריך פירעון {{ due_date | date: format: 'date' }}</p>
              {% endif %}
            {% endif %}
            </td>
          </tr>
          <tr>
            {% if shipping_method %}
              <td class="customer-info__item">
                <h4>שיטת משלוח</h4>
                <p>{{ shipping_method.title }}<br/>{{ shipping_method.price | money }}</p>
              </td>
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
      {% endif %}

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
`,
  },

  {
    id: "order_editted",
    title: "הזמנה עודכנה",
    subject: `הזמנה {{name}} עודכנה`,
    body: `{% assign delivery_method_types = delivery_agreements | map: 'delivery_method_type' | uniq %}
{% if delivery_method_types.size > 1 %}
  {% assign has_split_cart = true %}
{% else %}
  {% assign has_split_cart = false %}
{% endif %}
{% capture email_title %}ההזמנה שלך עודכנה{% endcapture %}
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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
            {% if custom_message != blank %}
            <p>{{ custom_message }}</p>
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
              <h3>הזמנה מעודכנת</h3>
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
      {% assign legacy_separator = true %}
      
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
      <td>
        {% if line.image %}
          <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
        {% endif %}
      </td>
      <td class="order-list__product-description-cell">
        {% if line.product.title %}
          {% assign line_title = line.product.title %}
        {% else %}
          {% assign line_title = line.title %}
        {% endif %}

        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} מתוך {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% capture line_display %}
            {{ line.quantity }}
          {% endcapture %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
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

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        <td class="order-list__price-cell">
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
        
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
      <td>
        {% if line.image %}
          <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
        {% endif %}
      </td>
      <td class="order-list__product-description-cell">
        {% if line.product.title %}
          {% assign line_title = line.product.title %}
        {% else %}
          {% assign line_title = line.title %}
        {% endif %}

        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} מתוך {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% capture line_display %}
            {{ line.quantity }}
          {% endcapture %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
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

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        <td class="order-list__price-cell">
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

      {% endfor %}
    </table>

    {% unless forloop.last %}
    <hr class="order-list__delivery-method-type-separator">
    {% endunless %}
  {% endif %}
{% endfor %}

            {% else %}
              
<table class="row">
  {% for line in subtotal_line_items %}
    
<tr class="order-list__item">
  <td class="order-list__item__cell">
    <table>
      <td>
        {% if line.image %}
          <img src="{{ line | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
        {% endif %}
      </td>
      <td class="order-list__product-description-cell">
        {% if line.product.title %}
          {% assign line_title = line.product.title %}
        {% else %}
          {% assign line_title = line.title %}
        {% endif %}

        {% if line.quantity < line.quantity %}
          {% capture line_display %}
            {{ line.quantity }} מתוך {{ line.quantity }}
          {% endcapture %}
        {% else %}
          {% capture line_display %}
            {{ line.quantity }}
          {% endcapture %}
        {% endif %}

        <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>

        {% if line.variant.title != 'Default Title' %}
          <span class="order-list__item-variant">{{ line.variant.title }}</span><br/>
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

        {% if line.discount_allocations %}
          {% for discount_allocation in line.discount_allocations %}
            {% if discount_allocation.discount_application.target_selection != 'all' %}
              <span class="order-list__item-discount-allocation">
                <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
                <span>
                  {{ discount_allocation.discount_application.title | upcase }}
                  (-{{ discount_allocation.amount | money }})
                </span>
              </span>
            {% endif %}
          {% endfor %}
        {% endif %}
      </td>
        <td class="order-list__price-cell">
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

  {% endfor %}
</table>

            {% endif %}
            <table class="row subtotal-lines">
  <tr>
    <td class="subtotal-spacer"></td>
    <td>
      <table class="row subtotal-table">

        
{% assign total_order_discount_amount = 0 %}
{% assign has_shipping_discount = false %}
{% assign epsilon = 0.00001 %}

{% for discount_application in discount_applications %}
  {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
    {% assign order_discount_count = order_discount_count | plus: 1 %}
    {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount %}
  {% endif %}
  {% if discount_application.target_type == 'shipping_line' %}
    {% assign has_shipping_discount = true %}
    {% assign shipping_discount_title = discount_application.title %}
    {% assign discount_value_price = discount_application.total_allocated_amount %}
    {% assign shipping_amount_minus_discount_value_price = shipping_price | minus: discount_value_price %}
    {% assign shipping_amount_minus_discount_value_price_abs = shipping_amount_minus_discount_value_price | abs %}
    {% assign discount_application_value_type = discount_application.value_type | strip %}
    {% if shipping_amount_minus_discount_value_price_abs < epsilon or discount_application_value_type == 'percentage' and discount_application.value == 100 %}
      {% assign free_shipping = true %}
    {% else %}
      {% assign discounted_shipping_price = shipping_amount_minus_discount_value_price %}
    {% endif %}
  {% endif %}
{% endfor %}



<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ביניים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ subtotal_price | plus: total_order_discount_amount | money }}</strong>
  </td>
</tr>



{% if order_discount_count > 0 %}
  {% if order_discount_count == 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחת הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% if order_discount_count > 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחות הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% for discount_application in discount_applications %}
    {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
      <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
        </span>
      </span>
    </p>
  </td>
</tr>

    {% endif %}
  {% endfor %}
{% endif %}


        {% unless retail_delivery_only %}
          {% if delivery_method == 'pick-up' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>איסוף</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

          {% else %}
            {% if has_shipping_discount %}
  {% if free_shipping == true %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{% if shipping_price != 0 %}{{ shipping_price | money}}{% endif %} </del>
      <strong>חינם</strong>
  </td>
</tr>

  {% else %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{{ shipping_price | money }} </del>
      <strong>{{ discounted_shipping_price | money }}</strong>
  </td>
</tr>

  {% endif %}
  <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ shipping_discount_title }} 
            {% if discount_value_price != 0 %}
              (-{{ discount_value_price | money }})
            {% endif %}
        </span>
      </span>
    </p>
  </td>
</tr>

{% else %}
  
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

{% endif %}

          {% endif %}
        {% endunless %}

        {% if total_duties %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מכס</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_duties | money }}</strong>
  </td>
</tr>

        {% endif %}

        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מסים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ tax_price | money }}</strong>
  </td>
</tr>


        {% if total_tip and total_tip > 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>טיפ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_tip | money }}</strong>
  </td>
</tr>

        {% endif %}
      </table>

      {% assign transaction_size = 0 %}
      {% assign transaction_amount = 0 %}
      {% assign net_transaction_amount_rounding = 0 %}
      {% assign authorized_amount = 0 %}
      {% assign has_refunds = false %}
      {% assign shopify_pay_captured = false %}
      {% assign shop_cash_offers_captured = false %}
      {% for transaction in transactions %}
        {% if transaction.status == "success" %}
          {% if transaction.kind == "sale" or transaction.kind == "capture"  %}
              {% if transaction.payment_details.credit_card_company %}
                {% assign shopify_pay_captured = true %}
              {% endif %}
              {% if transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                {% assign shop_cash_offers_captured = true %}
              {% endif %}
              {% assign transaction_size = transaction_size | plus: 1 %}
              {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
              {% if transaction.amount_rounding != nil %}
                {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
              {% endif %}
          {% elsif transaction.kind == "refund" or transaction.kind == "change" %}
            {% assign transaction_size = transaction_size | plus: 1 %}
            {% assign transaction_amount = transaction_amount | minus: transaction.amount %}
            {% assign has_refunds = true %}
            {% if transaction.amount_rounding != nil %}
              {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | minus: transaction.amount_rounding %}
            {% endif %}
          {% elsif transaction.kind == "authorization" %}
            {% assign authorized_amount = authorized_amount | plus: transaction.amount %}
          {% endif %}
        {% endif %}
      {% endfor %}

      {% # Add shop cash/offer transactions to totals if shopify pay is captured and shop cash/offer is not captured yet %}
      {% if shopify_pay_captured == true and shop_cash_offers_captured == false %}
        {% for transaction in transactions %}
        {% if transaction.status == "success" %}
          {% if transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
              {% assign transaction_size = transaction_size | plus: 1 %}
              {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
              {% if transaction.amount_rounding != nil %}
                {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
              {% endif %}
          {% endif %}
        {% endif %}
      {% endfor %}
      {% endif %}
      <table class="row subtotal-table subtotal-table--total">
      {% if payment_terms and payment_terms.automatic_capture_at_fulfillment == false or b2b? %}
        {% assign next_payment = payment_terms.next_payment %}
        {% assign due_at_date = next_payment.due_at | date: "%b %d, %Y" %}
        {% if net_transaction_amount_rounding != 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

          {% if total_discounts > 0 %}
            <tr class="subtotal-line">
              <td></td>
              <td class="subtotal-line__value total-discount">
                  חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
              </td>
            </tr>
          {% endif %}
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <div class="subtotal-line__value-small">
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>עיגול מזומן</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
  </td>
</tr>

          </div>
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
        {% endif %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ששולם היום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

        <div class="payment-terms">
          {% assign next_amount_due = total_price %}
          {% if next_payment %}
            {% assign next_amount_due = next_payment.amount_due %}
          {% elsif total_outstanding > 0 %}
            {% assign next_amount_due = total_outstanding %}
          {% endif %}

          {% if payment_terms.type == 'receipt' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם הקבלה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% elsif payment_terms.type == 'fulfillment' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם המילוי</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% else %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום {{ due_at_date }}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% endif %}
        </div>
        {% if total_discounts > 0 and net_transaction_amount_rounding == 0 %}
          <tr class="subtotal-line">
            <td></td>
            <td class="subtotal-line__value total-discount">
                חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
            </td>
          </tr>
        {% endif %}
      {% else %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

        {% if total_discounts > 0 %}
          <tr class="subtotal-line">
            <td></td>
            <td class="subtotal-line__value total-discount">
                חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
            </td>
          </tr>
        {% endif %}
        {% if net_transaction_amount_rounding != 0 %}
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <div class="subtotal-line__value-small">
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>עיגול מזומן</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
  </td>
</tr>

          </div>
          {% if financial_status == 'paid' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>שולם</span>
        <br>
        <small>{{ order.transactions | map: 'gateway_display_name' | uniq | join: ', ' }}</small>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

          {% endif %}
        {% endif %}
        {% if transaction_amount != total_price and payment_terms == nil%}
          {% if transaction_amount == 0 and authorized_amount > 0 and has_refunds == false %}
          {% else %}
            <div class="payment-terms">
              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ששולם היום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
  </td>
</tr>

            </div>
          {% endif %}
        {% endif %}
      {% endif %}
      </table>

      {% unless payment_terms %}
      {% if transaction_size > 1 or transaction_amount < total_price %}
        <table class="row subtotal-table">
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <tr><td colspan="2" class="subtotal-table__small-space"></td></tr>

          {% for transaction in transactions %}
            {% assign amount_rounding = 0 %}
            {% if transaction.amount_rounding != 0 %}
              {% assign amount_rounding =  transaction.amount_rounding %}
            {% endif %}
            {% if transaction.status == "success" and transaction.kind == "capture" or transaction.kind == "sale" %}
              {% if transaction.payment_details.gift_card_last_four_digits %}
                {% capture transaction_name %}כרטיס מתנה (מסתיים ב {{ transaction.payment_details.gift_card_last_four_digits }}){% endcapture %}
              {% elsif transaction.payment_details.credit_card_company %}
                {% capture transaction_name %}{{ transaction.payment_details.credit_card_company }} (מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }}){% endcapture %}
              {% else %}
                {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}
              {% endif %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{transaction_name}}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% elsif shopify_pay_captured and shop_cash_offers_captured == false and transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
              {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{transaction_name}}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% endif %}
            {% if transaction.kind == 'refund' and transaction.gateway != "shop_offer" %}
              {% if transaction.payment_details.gift_card_last_four_digits %}
                {% assign refund_method_title = transaction.payment_details.type %}
              {% elsif transaction.payment_details.credit_card_company %}
                {% assign refund_method_title = transaction.payment_details.credit_card_company %}
              {% else %}
                {% assign refund_method_title = transaction.gateway_display_name %}
              {% endif %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>החזר</span>
        <br>
        <small>{{ refund_method_title | replace: '_', ' ' | capitalize }}</small>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>- {{ transaction.amount | plus: amount_rounding | money }}</strong>
  </td>
</tr>

            {% endif %}
          {% endfor %}
        </table>
      {% endif %}


      {% endunless %}
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
                {% if transaction_size > 0 or payment_terms %}
                  <td class="customer-info__item">
                    <h4>תשלום</h4>
                    <p class="customer-info__item-content">
                      {% if payment_terms %}
                        {% assign due_date = payment_terms.next_payment.due_at | default: nil %}
                        {% if payment_terms.type == 'receipt' or payment_terms.type == 'fulfillment' and payment_terms.next_payment.due_at == nil %}
                          {{ payment_terms.translated_name }}<br>
                        {% else %}
                          {{ payment_terms.translated_name }}: תאריך פירעון {{ due_date | date: format: 'date' }}<br>
                        {% endif %}
                      {% endif %}
                      {% if transaction_size > 0 %}
                        {% for transaction in transactions %}
                          {% if transaction.status == "success" or transaction.status == "pending" %}
                            {% if transaction.kind == "capture" or transaction.kind == "sale" %}
                                {% if transaction.payment_details.credit_card_company %}
                                  {% capture credit_card_url %}notifications/{{ transaction.payment_details.credit_card_company | downcase | replace: " ", "_" }}.png{% endcapture %}
                                  <img src="{{ credit_card_url | shopify_asset_url }}" class="customer-info__item-credit" height="24">
                                  <span>תשלום</span><br>
                                {% elsif transaction.gateway != "shop_offer" %}
                                  {{ transaction.gateway_display_name }}<br>
                                {% endif %}
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
                      <p>{{ shipping_method.title }}</p>
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

`,
  },

  {
    id: "order_cancelled",
    title: "הזמנה בוטלה",
    subject: `הזמנה {{ name }} בוטלה`,
    body: `{% capture email_title %}ההזמנה שלך בוטלה{% endcapture %}
  {% capture email_body %}
    {% if financial_status == 'voided' %}
      {% case cancel_reason %}
      {% when 'customer' %}
        הזמנה {{ name }} בוטלה לפי בקשתך והתשלום שלך בוטל.
      {% when 'inventory' %}
        הזמנה {{ name }} בוטלה כיוון שלא היה לנו מספיק מלאי למילוי ההזמנה והתשלום שלך בוטל.
      {% when 'fraud' %}
        הזמנה {{ name }} בוטלה בגלל נסיבות בלתי צפויות והתשלום שלך בוטל.
      {% when 'declined' %}
       הזמנה {{ name }} בוטלה כיוון שהתשלום שלך נדחה.
      {% when 'staff' %}
       הזמנה {{ name }} בוטלה בגלל טעות צוות והתשלום שלך בוטל.
      {% when 'other' %}
        הזמנה {{ name }} בוטלה בגלל נסיבות בלתי צפויות והתשלום שלך בוטל.
      {% endcase %}
    {% elsif financial_status == 'refunded' %}
      {% case cancel_reason %}
      {% when 'customer' %}
        הזמנה {{ name }} בוטלה לפי בקשתך והתשלום שלך הוחזר.
      {% when 'inventory' %}
        הזמנה {{ name }} בוטלה כיוון שלא היה לנו מספיק מלאי למילוי ההזמנה והתשלום שלך הוחזר.
      {% when 'fraud' %}
        הזמנה {{ name }} בוטלה בגלל נסיבות בלתי צפויות והתשלום שלך הוחזר.
      {% when 'declined' %}
        הזמנה {{ name }} בוטלה כיוון שהתשלום שלך נדחה.
      {% when 'staff' %}
        הזמנה {{ name }} בוטלה בגלל טעות צוות והתשלום שלך הוחזר.
      {% when 'other' %}
        הזמנה {{ name }} בוטלה בגלל נסיבות בלתי צפויות והתשלום שלך הוחזר.
      {% endcase %}
    {% elsif financial_status == 'paid' %}
      {% case cancel_reason %}
      {% when 'customer' %}
        הזמנה {{ name }} בוטלה לפי בקשתך והתשלום שלך עדיין לא הוחזר.
      {% when 'inventory' %}
        הזמנה {{ name }} בוטלה כיוון שלא היה לנו מספיק מלאי למילוי ההזמנה והתשלום שלך עדיין לא הוחזר.
      {% when 'fraud' %}
        הזמנה {{ name }} בוטלה בגלל נסיבות בלתי צפויות והתשלום שלך עדיין לא הוחזר.
      {% when 'declined' %}
        הזמנה {{ name }} בוטלה כיוון שהתשלום שלך נדחה.
      {% when 'staff' %}
        הזמנה {{ name }} בוטלה בגלל טעות צוות והתשלום שלך עדיין לא הוחזר.
      {% when 'other' %}
        הזמנה {{ name }} בוטלה בגלל נסיבות בלתי צפויות והתשלום שלך עדיין לא הוחזר.
      {% endcase %}
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
                      {%- if shop.email_logo_url %}
                        <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
  
              </td>
            </tr>
          </table>
        </center>
      </td>
    </tr>
  </table>
  
            {% if void_transactions %}
            {% endif %}
  
            <table class="row section">
    <tr>
      <td class="section__cell">
        <center>
          <table class="container">
            <tr>
              <td>
                <h3>פריטים שהוסרו</h3>
              </td>
            </tr>
          </table>
          <table class="container">
            <tr>
              <td>
                
              
    <table class="row">
      {% for line in subtotal_line_items %}
        
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
              {{ line.quantity }} מתוך {{ line.quantity }}
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
  
      {% endfor %}
    </table>
  
              <table class="row subtotal-lines">
    <tr>
      <td class="subtotal-spacer"></td>
      <td>
        <table class="row subtotal-table">
  
          
  {% assign total_order_discount_amount = 0 %}
  {% assign has_shipping_discount = false %}
  {% assign epsilon = 0.00001 %}
  
  {% for discount_application in discount_applications %}
    {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
      {% assign order_discount_count = order_discount_count | plus: 1 %}
      {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount %}
    {% endif %}
    {% if discount_application.target_type == 'shipping_line' %}
      {% assign has_shipping_discount = true %}
      {% assign shipping_discount_title = discount_application.title %}
      {% assign discount_value_price = discount_application.total_allocated_amount %}
      {% assign shipping_amount_minus_discount_value_price = shipping_price | minus: discount_value_price %}
      {% assign shipping_amount_minus_discount_value_price_abs = shipping_amount_minus_discount_value_price | abs %}
      {% assign discount_application_value_type = discount_application.value_type | strip %}
      {% if shipping_amount_minus_discount_value_price_abs < epsilon or discount_application_value_type == 'percentage' and discount_application.value == 100 %}
        {% assign free_shipping = true %}
      {% else %}
        {% assign discounted_shipping_price = shipping_amount_minus_discount_value_price %}
      {% endif %}
    {% endif %}
  {% endfor %}
  
  
  
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום ביניים</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ subtotal_price | plus: total_order_discount_amount | money }}</strong>
    </td>
  </tr>
  
  
  
  {% if order_discount_count > 0 %}
    {% if order_discount_count == 1 %}
      
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>הנחת הזמנה</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>-{{ total_order_discount_amount | money }}</strong>
    </td>
  </tr>
  
    {% endif %}
    {% if order_discount_count > 1 %}
      
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>הנחות הזמנה</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>-{{ total_order_discount_amount | money }}</strong>
    </td>
  </tr>
  
    {% endif %}
    {% for discount_application in discount_applications %}
      {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
        <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span class="subtotal-line__discount">
          <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
          <span class="subtotal-line__discount-title">
              {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
          </span>
        </span>
      </p>
    </td>
  </tr>
  
      {% endif %}
    {% endfor %}
  {% endif %}
  
  
          {% unless retail_delivery_only %}
            {% if delivery_method == 'pick-up' %}
              
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>איסוף</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ shipping_price | money }}</strong>
    </td>
  </tr>
  
            {% else %}
              {% if has_shipping_discount %}
    {% if free_shipping == true %}
      
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>משלוח</span>
      </p>
    </td>
    <td class="subtotal-line__value">
      <del>{% if shipping_price != 0 %}{{ shipping_price | money}}{% endif %} </del>
        <strong>חינם</strong>
    </td>
  </tr>
  
    {% else %}
      
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>משלוח</span>
      </p>
    </td>
    <td class="subtotal-line__value">
      <del>{{ shipping_price | money }} </del>
        <strong>{{ discounted_shipping_price | money }}</strong>
    </td>
  </tr>
  
    {% endif %}
    <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span class="subtotal-line__discount">
          <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
          <span class="subtotal-line__discount-title">
              {{ shipping_discount_title }} 
              {% if discount_value_price != 0 %}
                (-{{ discount_value_price | money }})
              {% endif %}
          </span>
        </span>
      </p>
    </td>
  </tr>
  
  {% else %}
    
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>משלוח</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ shipping_price | money }}</strong>
    </td>
  </tr>
  
  {% endif %}
  
            {% endif %}
          {% endunless %}
  
          {% if total_duties %}
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>מכס</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_duties | money }}</strong>
    </td>
  </tr>
  
          {% endif %}
  
          
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>מסים</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ tax_price | money }}</strong>
    </td>
  </tr>
  
  
          {% if total_tip and total_tip > 0 %}
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>טיפ</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_tip | money }}</strong>
    </td>
  </tr>
  
          {% endif %}
        </table>
  
        {% assign transaction_size = 0 %}
        {% assign transaction_amount = 0 %}
        {% assign net_transaction_amount_rounding = 0 %}
        {% assign authorized_amount = 0 %}
        {% assign has_refunds = false %}
        {% assign shopify_pay_captured = false %}
        {% assign shop_cash_offers_captured = false %}
        {% for transaction in transactions %}
          {% if transaction.status == "success" %}
            {% if transaction.kind == "sale" or transaction.kind == "capture"  %}
                {% if transaction.payment_details.credit_card_company %}
                  {% assign shopify_pay_captured = true %}
                {% endif %}
                {% if transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                  {% assign shop_cash_offers_captured = true %}
                {% endif %}
                {% assign transaction_size = transaction_size | plus: 1 %}
                {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
                {% if transaction.amount_rounding != nil %}
                  {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
                {% endif %}
            {% elsif transaction.kind == "refund" or transaction.kind == "change" %}
              {% assign transaction_size = transaction_size | plus: 1 %}
              {% assign transaction_amount = transaction_amount | minus: transaction.amount %}
              {% assign has_refunds = true %}
              {% if transaction.amount_rounding != nil %}
                {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | minus: transaction.amount_rounding %}
              {% endif %}
            {% elsif transaction.kind == "authorization" %}
              {% assign authorized_amount = authorized_amount | plus: transaction.amount %}
            {% endif %}
          {% endif %}
        {% endfor %}
  
        {% # Add shop cash/offer transactions to totals if shopify pay is captured and shop cash/offer is not captured yet %}
        {% if shopify_pay_captured == true and shop_cash_offers_captured == false %}
          {% for transaction in transactions %}
          {% if transaction.status == "success" %}
            {% if transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                {% assign transaction_size = transaction_size | plus: 1 %}
                {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
                {% if transaction.amount_rounding != nil %}
                  {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
                {% endif %}
            {% endif %}
          {% endif %}
        {% endfor %}
        {% endif %}
        <table class="row subtotal-table subtotal-table--total">
        {% if payment_terms and payment_terms.automatic_capture_at_fulfillment == false or b2b? %}
          {% assign next_payment = payment_terms.next_payment %}
          {% assign due_at_date = next_payment.due_at | date: "%b %d, %Y" %}
          {% if net_transaction_amount_rounding != 0 %}
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סה"כ</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_price | money_with_currency }}</strong>
    </td>
  </tr>
  
            {% if total_discounts > 0 %}
              <tr class="subtotal-line">
                <td></td>
                <td class="subtotal-line__value total-discount">
                    חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
                </td>
              </tr>
            {% endif %}
            <tr><td colspan="2" class="subtotal-table__line"></td></tr>
            <div class="subtotal-line__value-small">
              
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>עיגול מזומן</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
    </td>
  </tr>
  
            </div>
            <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          {% endif %}
          
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום ששולם היום</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
    </td>
  </tr>
  
          <div class="payment-terms">
            {% assign next_amount_due = total_price %}
            {% if next_payment %}
              {% assign next_amount_due = next_payment.amount_due %}
            {% elsif total_outstanding > 0 %}
              {% assign next_amount_due = total_outstanding %}
            {% endif %}
  
            {% if payment_terms.type == 'receipt' %}
              
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום לתשלום עם הקבלה</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ next_amount_due | money_with_currency }}</strong>
    </td>
  </tr>
  
            {% elsif payment_terms.type == 'fulfillment' %}
              
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום לתשלום עם המילוי</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ next_amount_due | money_with_currency }}</strong>
    </td>
  </tr>
  
            {% else %}
              
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום לתשלום {{ due_at_date }}</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ next_amount_due | money_with_currency }}</strong>
    </td>
  </tr>
  
            {% endif %}
          </div>
          {% if total_discounts > 0 and net_transaction_amount_rounding == 0 %}
            <tr class="subtotal-line">
              <td></td>
              <td class="subtotal-line__value total-discount">
                  חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
              </td>
            </tr>
          {% endif %}
        {% else %}
          
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סה"כ</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_price | money_with_currency }}</strong>
    </td>
  </tr>
  
          {% if total_discounts > 0 %}
            <tr class="subtotal-line">
              <td></td>
              <td class="subtotal-line__value total-discount">
                  חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
              </td>
            </tr>
          {% endif %}
          {% if net_transaction_amount_rounding != 0 %}
            <tr><td colspan="2" class="subtotal-table__line"></td></tr>
            <div class="subtotal-line__value-small">
              
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>עיגול מזומן</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
    </td>
  </tr>
  
            </div>
            {% if financial_status == 'paid' %}
              
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>שולם</span>
          <br>
          <small>{{ order.transactions | map: 'gateway_display_name' | uniq | join: ', ' }}</small>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
    </td>
  </tr>
  
            {% endif %}
          {% endif %}
          {% if transaction_amount != total_price and payment_terms == nil%}
            {% if transaction_amount == 0 and authorized_amount > 0 and has_refunds == false %}
            {% else %}
              <div class="payment-terms">
                
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום ששולם היום</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
    </td>
  </tr>
  
              </div>
            {% endif %}
          {% endif %}
        {% endif %}
        </table>
  
        {% unless payment_terms %}
        {% if transaction_size > 1 or transaction_amount < total_price %}
          <table class="row subtotal-table">
            <tr><td colspan="2" class="subtotal-table__line"></td></tr>
            <tr><td colspan="2" class="subtotal-table__small-space"></td></tr>
  
            {% for transaction in transactions %}
              {% assign amount_rounding = 0 %}
              {% if transaction.amount_rounding != 0 %}
                {% assign amount_rounding =  transaction.amount_rounding %}
              {% endif %}
              {% if transaction.status == "success" and transaction.kind == "capture" or transaction.kind == "sale" %}
                {% if transaction.payment_details.gift_card_last_four_digits %}
                  {% capture transaction_name %}כרטיס מתנה (מסתיים ב {{ transaction.payment_details.gift_card_last_four_digits }}){% endcapture %}
                {% elsif transaction.payment_details.credit_card_company %}
                  {% capture transaction_name %}{{ transaction.payment_details.credit_card_company }} (מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }}){% endcapture %}
                {% else %}
                  {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}
                {% endif %}
  
                
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>{{transaction_name}}</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
    </td>
  </tr>
  
              {% elsif shopify_pay_captured and shop_cash_offers_captured == false and transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}
  
                
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>{{transaction_name}}</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
    </td>
  </tr>
  
              {% endif %}
              {% if transaction.kind == 'refund' and transaction.gateway != "shop_offer" %}
                {% if transaction.payment_details.gift_card_last_four_digits %}
                  {% assign refund_method_title = transaction.payment_details.type %}
                {% elsif transaction.payment_details.credit_card_company %}
                  {% assign refund_method_title = transaction.payment_details.credit_card_company %}
                {% else %}
                  {% assign refund_method_title = transaction.gateway_display_name %}
                {% endif %}
  
                
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>החזר</span>
          <br>
          <small>{{ refund_method_title | replace: '_', ' ' | capitalize }}</small>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>- {{ transaction.amount | plus: amount_rounding | money }}</strong>
    </td>
  </tr>
  
              {% endif %}
            {% endfor %}
          </table>
        {% endif %}
  
  
        {% endunless %}
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
  `,
  },

  {
    id: "order_payment_receipt",
    title: "קבלת תשלום הזמנה",
    subject: `[{{ shop.name }}] קבלת תשלום עבור הזמנה {{ name }}`,
    body: `<!DOCTYPE html>
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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
              
            <h2>התשלום שלך עובד</h2>
            <p>
              {% for transaction in transactions %}
                {% if transaction.id == transaction_id %}
                  חויבת בסכום <b>{{ transaction.amount | money_with_currency }}</b> עבור הזמנה {{ order_name }}.
                {% endif %}
              {% endfor %}
            </p>
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
              <h3>פרטי לקוח</h3>
            </td>
          </tr>
        </table>
        <table class="container">
          <tr>
            <td>
              
            <table class="row">
              <tr>
                <td class="customer-info__item">
                  <h4>כתובת חיוב</h4>
                  {{ address | format_address }}
                </td>

                {% assign transaction_count = transactions | size %}
                {% if transaction_count > 0 %}
                <td class="customer-info__item" valign="top">
                  <h4>תשלום</h4>
                  {% for transaction in transactions %}
                    {% if transaction.id == transaction_id %}
                      {% if transaction.status == "success" or transaction.status == "pending" %}
                        {% if transaction.kind == "capture" or transaction.kind == "sale" %}
                          {% if transaction.payment_details.credit_card_company %}
                            <p class="customer-info__item-content">
                              <img src="{{ transaction.payment_details.credit_card_company | downcase | replace: ' ', '-'  | payment_type_img_url }}" class="customer-info__item-credit" height="24">
                              <span>מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }} &mdash; <strong>{{ transaction.amount | money }}</strong></span>
                            </p>
                          {% else %}
                            <p class="customer-info__item-content">
                            {{ transaction.gateway_display_name }} &mdash; <strong>{{ transaction.amount | money }}</strong>
                            </p>
                          {% endif %}
                        {% endif %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                </td>
                {% endif %}
              </tr>
            </table>
            {% if company_location %}
              <table class="row">
                <tr>
                  <td class="customer-info__item">
                    <h4>מיקום</h4>
                      <p>{{ company_location.name }}</p>
                  </td>
                </tr>
              </table>
            {% endif %}

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
`,
  },

  {
    id: "order_refund",
    title: "החזר הזמנה",
    subject: `הודעת החזר`,
    body: `{% if refund_line_items.size == item_count %}
  {% capture email_title %}ההזמנה שלך הוחזרה{% endcapture %}
{% elsif refund_line_items.size == 0 %}
  {% capture email_title %}קיבלת החזר{% endcapture %}
{% else %}
  {% capture email_title %}חלק מהפריטים בהזמנה שלך הוחזרו{% endcapture %}
{% endif %}
{% capture email_body %}סכום החזר כולל: <strong>{{ amount | money_with_currency }}</strong>. יכול לקחת עד 10 ימים עד שההחזר יופיע בחשבונך.{% endcapture %}

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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
              
            {% if line_items_including_zero_quantity == empty %}
              
<table class="row">
  {% for line in subtotal_line_items %}
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
          {% if line.product.title %}
            {% assign line_title = line.product.title %}
          {% else %}
            {% assign line_title = line.title %}
          {% endif %}

          {% if line.quantity < line.quantity %}
            {% capture line_display %}
              {{ line.quantity }} מתוך {{ line.quantity }}
            {% endcapture %}
          {% else %}
            {% assign line_display = line.quantity  %}
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
                          <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image"/>
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

          {% if line.aggregated_update %}
            <span class="order-list__item-update-status">{{line.aggregated_update}}</span>
          {% elsif line.refunded_quantity > 0 %}
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
              {% if line.final_line_price > 0 or line.quantity == 0 %}
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
  </tr>{% endfor %}
</table>

            {% else %}
              
<table class="row">
  {% for line in line_items_including_zero_quantity %}
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
          {% if line.product.title %}
            {% assign line_title = line.product.title %}
          {% else %}
            {% assign line_title = line.title %}
          {% endif %}

          {% if line.quantity < line.quantity %}
            {% capture line_display %}
              {{ line.quantity }} מתוך {{ line.quantity }}
            {% endcapture %}
          {% else %}
            {% assign line_display = line.quantity  %}
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
                          <img src="{{ component | img_url: 'compact_cropped' }}" align="left" width="40" height="40" class="order-list__product-image"/>
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

          {% if line.aggregated_update %}
            <span class="order-list__item-update-status">{{line.aggregated_update}}</span>
          {% elsif line.refunded_quantity > 0 %}
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
              {% if line.final_line_price > 0 or line.quantity == 0 %}
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
  </tr>{% endfor %}
</table>

            {% endif %}
            <table class="row subtotal-lines">
  <tr>
    <td class="subtotal-spacer"></td>
    <td>
      <table class="row subtotal-table">
        
{% assign total_order_discount_amount = 0 %}
{% assign has_shipping_discount = false %}
{% assign epsilon = 0.00001 %}

{% for discount_application in discount_applications %}
  {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
    {% assign order_discount_count = order_discount_count | plus: 1 %}
    {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount %}
  {% endif %}
  {% if discount_application.target_type == 'shipping_line' %}
    {% assign has_shipping_discount = true %}
    {% assign shipping_discount_title = discount_application.title %}
    {% assign discount_value_price = discount_application.total_allocated_amount %}
    {% assign shipping_amount_minus_discount_value_price = shipping_price | minus: discount_value_price %}
    {% assign shipping_amount_minus_discount_value_price_abs = shipping_amount_minus_discount_value_price | abs %}
    {% assign discount_application_value_type = discount_application.value_type | strip %}
    {% if shipping_amount_minus_discount_value_price_abs < epsilon or discount_application_value_type == 'percentage' and discount_application.value == 100 %}
      {% assign free_shipping = true %}
    {% else %}
      {% assign discounted_shipping_price = shipping_amount_minus_discount_value_price %}
    {% endif %}
  {% endif %}
{% endfor %}



<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ביניים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ subtotal_price | plus: total_order_discount_amount | money }}</strong>
  </td>
</tr>



{% if order_discount_count > 0 %}
  {% if order_discount_count == 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחת הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% if order_discount_count > 1 %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>הנחות הזמנה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>-{{ total_order_discount_amount | money }}</strong>
  </td>
</tr>

  {% endif %}
  {% for discount_application in discount_applications %}
    {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
      <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
        </span>
      </span>
    </p>
  </td>
</tr>

    {% endif %}
  {% endfor %}
{% endif %}


        {% unless retail_delivery_only %}
          {% if delivery_method == 'pick-up' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>איסוף</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

          {% else %}
            {% if has_shipping_discount %}
  {% if free_shipping == true %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{% if shipping_price != 0 %}{{ shipping_price | money}}{% endif %} </del>
      <strong>חינם</strong>
  </td>
</tr>

  {% else %}
    
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
    <del>{{ shipping_price | money }} </del>
      <strong>{{ discounted_shipping_price | money }}</strong>
  </td>
</tr>

  {% endif %}
  <tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span class="subtotal-line__discount">
        <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
        <span class="subtotal-line__discount-title">
            {{ shipping_discount_title }} 
            {% if discount_value_price != 0 %}
              (-{{ discount_value_price | money }})
            {% endif %}
        </span>
      </span>
    </p>
  </td>
</tr>

{% else %}
  
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>משלוח</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ shipping_price | money }}</strong>
  </td>
</tr>

{% endif %}

          {% endif %}
        {% endunless %}

        {% if total_duties %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מכס</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_duties | money }}</strong>
  </td>
</tr>

        {% endif %}

        {% for fee in fees %}
  
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{ fee.title }}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ fee.subtotal | money }}</strong>
  </td>
</tr>

{% endfor %}


        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>מסים</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ tax_price | money }}</strong>
  </td>
</tr>


        {% if total_tip and total_tip > 0 %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>טיפ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_tip | money }}</strong>
  </td>
</tr>

        {% endif %}
      </table>

      {% assign transaction_size = 0 %}
      {% assign transaction_amount = 0 %}
      {% for transaction in transactions %}
        {% if transaction.status == "success" %}
          {% if transaction.kind == "sale" or transaction.kind == "capture"  %}
            {% assign transaction_size = transaction_size | plus: 1 %}
            {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
          {% elsif transaction.kind == "refund" or transaction.kind == "change" %}
            {% assign transaction_size = transaction_size | plus: 1 %}
            {% assign transaction_amount = transaction_amount | minus: transaction.amount %}
          {% endif %}
        {% endif %}
      {% endfor %}

      <table class="row subtotal-table subtotal-table--total">
      {% if payment_terms and payment_terms.automatic_capture_at_fulfillment == false or b2b?%}
        {% assign next_payment = payment_terms.next_payment %}
        {% assign due_at_date = next_payment.due_at | date: "%b %d, %Y" %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ששולם היום</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | money_with_currency }}</strong>
  </td>
</tr>

        <div class="payment-terms">
          {% assign next_amount_due = total_price %}
          {% if next_payment %}
            {% assign next_amount_due = next_payment.amount_due %}
          {% endif %}

          {% if payment_terms.type == 'receipt' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם הקבלה</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% elsif payment_terms.type == 'fulfillment' %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום עם המילוי</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% else %}
            
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום לתשלום {{ due_at_date }}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ next_amount_due | money_with_currency }}</strong>
  </td>
</tr>

          {% endif %}
        </div>
      {% elsif transaction_amount != total_price %}
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

        <div class="payment-terms">
          
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סכום ששולם</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction_amount | money_with_currency }}</strong>
  </td>
</tr>

        </div>
      {% else %}
        
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>סה"כ</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ total_price | money_with_currency }}</strong>
  </td>
</tr>

      {% endif %}
      </table>

      {% if total_discounts > 0 %}
        <p class="total-discount">
          חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
        </p>
      {% endif %}

      {% unless payment_terms %}
      {% if transaction_size > 1 or transaction_amount < total_price %}
        <table class="row subtotal-table">
          <tr><td colspan="2" class="subtotal-table__line"></td></tr>
          <tr><td colspan="2" class="subtotal-table__small-space"></td></tr>

          {% for transaction in transactions %}
            {% if transaction.status == "success" and transaction.kind == "capture" or transaction.kind == "sale" %}
              {% if transaction.payment_details.credit_card_company %}
                {% capture transaction_name %}{{ transaction.payment_details.credit_card_company }} (מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }}){% endcapture %}
              {% else %}
                {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}
              {% endif %}

              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>{{transaction_name}}</span>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>{{ transaction.amount | money }}</strong>
  </td>
</tr>

            {% endif %}
            {% if transaction.kind == 'refund' and transaction.gateway != "shop_offer" %}
              {% if transaction.payment_details.credit_card_company %}
                {% assign refund_method_title = transaction.payment_details.credit_card_company %}
              {% else %}
                {% assign refund_method_title = transaction.gateway_display_name %}
              {% endif %}

              {% assign current_date = transaction.created_at | date: "%B %e, %Y" %}
              
<tr class="subtotal-line">
  <td class="subtotal-line__title">
    <p>
      <span>החזר</span>
        <br>
        <small>{{ refund_method_title | replace: '_', ' ' | capitalize }}</small>
    </p>
  </td>
  <td class="subtotal-line__value">
      <strong>- {{ transaction.amount | money }}</strong>
  </td>
</tr>

            {% endif %}
          {% endfor %}
        </table>
      {% endif %}


      {% endunless %}
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
`,
  },

  {
    id: "payment_error",
    title: "שגיאת תשלום",
    subject: `[{{shop.name}}] לא ניתן היה לעבד את התשלום`,
    body: `{% capture email_title %} לא ניתן היה לעבד את התשלום {% endcapture %}
{% capture email_body %}
  הוספת פריטים לעגלת הקניות שלך אך לא ניתן היה לעבד את התשלום. לא חויבת.
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
                    {%- if shop.email_logo_url %}
                      <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
                    {%- else %}
                      <h1 class="shop-name__text">
                        <a href="{{shop.url}}">{{ shop.name }}</a>
                      </h1>
                    {%- endif %}
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
            <p>עדיין תוכל/י לחזור לעגלה שלך כדי להשלים את הרכישה.</p>
            {% if shop.url %}
              <table class="row actions">
                <tr>
                  <td class="actions__cell">
                    <table class="button main-action-cell">
                      <tr>
                        <table class="row actions">
  <tr>
    <td class="empty-line">&nbsp;</td>
  </tr>
  <tr>
    <td class="actions__cell">
      <table class="button main-action-cell">
        <tr>
          <td class="button__cell"><a href="{{ url }}" class="button__text">חזור לעגלה</a></td>
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

                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            {% endif %}

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
`,
  },

  {
    id: "pending_payment_error",
    title: "שגיאת תשלום ממתין",
    subject: `[{{shop.name}}] לא ניתן היה לעבד את התשלום עבור הזמנה {{ name }}`,
    body: `{% capture email_title %} לא ניתן היה לעבד את התשלום עבור הזמנה {{ order_name }} {% endcapture %}
  {% capture email_body %}
    לא חויבת, אנא נסה לשלם עבור ההזמנה שוב.
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
                      {%- if shop.email_logo_url %}
                        <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
          <table class="row actions">
    <tr>
      <td class="actions__cell">
        <table class="button main-action-cell">
          <tr>
            <td class="button__cell"><a href="{{ checkout_payment_collection_url }}" class="button__text">שלם עכשיו</a></td>
          </tr>
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
              {{ line.quantity }} מתוך {{ line.quantity }}
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
    {% for line_item_group in line_item_groups %}
      
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
  
                    {% if line_item_group.deliverable? %}
                      <span class="order-list__item-title">{{ component_title }}&nbsp;&times;&nbsp;{{ component.quantity }}</span><br/>
                    {% else %}
                      <span class="order-list__item-title">{{ component.quantity }}&nbsp;&times;&nbsp;{{ component_title }}</span><br/>
                    {% endif %}
  
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
    {% endfor %}
  </table>
  
          <table class="row subtotal-lines">
    <tr>
      <td class="subtotal-spacer"></td>
      <td>
        <table class="row subtotal-table">
  
          
  {% assign total_order_discount_amount = 0 %}
  {% assign has_shipping_discount = false %}
  {% assign epsilon = 0.00001 %}
  
  {% for discount_application in discount_applications %}
    {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
      {% assign order_discount_count = order_discount_count | plus: 1 %}
      {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount %}
    {% endif %}
    {% if discount_application.target_type == 'shipping_line' %}
      {% assign has_shipping_discount = true %}
      {% assign shipping_discount_title = discount_application.title %}
      {% assign discount_value_price = discount_application.total_allocated_amount %}
      {% assign shipping_amount_minus_discount_value_price = shipping_price | minus: discount_value_price %}
      {% assign shipping_amount_minus_discount_value_price_abs = shipping_amount_minus_discount_value_price | abs %}
      {% assign discount_application_value_type = discount_application.value_type | strip %}
      {% if shipping_amount_minus_discount_value_price_abs < epsilon or discount_application_value_type == 'percentage' and discount_application.value == 100 %}
        {% assign free_shipping = true %}
      {% else %}
        {% assign discounted_shipping_price = shipping_amount_minus_discount_value_price %}
      {% endif %}
    {% endif %}
  {% endfor %}
  
  
  
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום ביניים</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ subtotal_price | plus: total_order_discount_amount | money }}</strong>
    </td>
  </tr>
  
  
  
  {% if order_discount_count > 0 %}
    {% if order_discount_count == 1 %}
      
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>הנחת הזמנה</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>-{{ total_order_discount_amount | money }}</strong>
    </td>
  </tr>
  
    {% endif %}
    {% if order_discount_count > 1 %}
      
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>הנחות הזמנה</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>-{{ total_order_discount_amount | money }}</strong>
    </td>
  </tr>
  
    {% endif %}
    {% for discount_application in discount_applications %}
      {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
        <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span class="subtotal-line__discount">
          <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
          <span class="subtotal-line__discount-title">
              {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
          </span>
        </span>
      </p>
    </td>
  </tr>
  
      {% endif %}
    {% endfor %}
  {% endif %}
  
  
          {% if has_shipping_discount %}
    {% if free_shipping == true %}
      
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>משלוח</span>
      </p>
    </td>
    <td class="subtotal-line__value">
      <del>{% if shipping_price != 0 %}{{ shipping_price | money}}{% endif %} </del>
        <strong>חינם</strong>
    </td>
  </tr>
  
    {% else %}
      
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>משלוח</span>
      </p>
    </td>
    <td class="subtotal-line__value">
      <del>{{ shipping_price | money }} </del>
        <strong>{{ discounted_shipping_price | money }}</strong>
    </td>
  </tr>
  
    {% endif %}
    <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span class="subtotal-line__discount">
          <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
          <span class="subtotal-line__discount-title">
              {{ shipping_discount_title }} 
              {% if discount_value_price != 0 %}
                (-{{ discount_value_price | money }})
              {% endif %}
          </span>
        </span>
      </p>
    </td>
  </tr>
  
  {% else %}
    
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>משלוח</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ shipping_price | money }}</strong>
    </td>
  </tr>
  
  {% endif %}
  
  
          {% for fee in fees %}
    
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>{{ fee.title }}</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ fee.subtotal | money }}</strong>
    </td>
  </tr>
  
  {% endfor %}
  
          
          {% if total_duties %}
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>מכס</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_duties | money }}</strong>
    </td>
  </tr>
  
          {% endif %}
          
          
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>מסים</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ tax_price | money }}</strong>
    </td>
  </tr>
  
  
          {% if total_tip_received and total_tip_received > 0 %}
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>טיפ</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_tip_received | money }}</strong>
    </td>
  </tr>
  
          {% endif %}
        </table>
      </td>
    </tr>
  </table>
  
          {% assign capture_transactions = transactions | where: 'kind', "capture" %}
  {% assign sale_transactions = transactions | where: 'kind', "sale" %}
  {% assign shop_cash_transactions = transactions | where: 'gateway_display_name', "Shop Cash" %}
  {% assign authorized_shop_cash_transactions = shop_cash_transactions | where: 'kind', "authorization" %}
  {% assign capture_and_sale_transactions = capture_transactions | concat: sale_transactions %}
  {% assign filtered_transactions = capture_and_sale_transactions | concat: authorized_shop_cash_transactions %}
  {% assign transaction_count = filtered_transactions | size %}
  
  {% if transaction_count > 0 %}
    <table class="row subtotal-lines">
      <tr>
        <td class="subtotal-spacer"></td>
        <td>
          <table class="row subtotal-table">
            {% for transaction in filtered_transactions %}
              {% capture title %}
                {% if transaction.payment_details.gift_card_last_four_digits %}
                  כרטיס מתנה (מסתיים ב {{ transaction.payment_details.gift_card_last_four_digits }})
                {% elsif transaction.payment_details.credit_card_company %}
                  {{ transaction.payment_details.credit_card_company | capitalize }} (מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }})
                {% elsif transaction.gateway_display_name == "Gift card" %}
                  כרטיס מתנה (מסתיים ב {{ transaction.payment_details.gift_card.last_four_characters | upcase }})
                {% elsif transaction.gateway_display_name == "Shop Cash" and transaction.kind == "authorization" %}
                  Shop Cash
                {% elsif transaction.gateway_display_name != "Shop Cash" %}
                  {{ transaction.gateway_display_name }}
                {% endif %}
              {% endcapture%}
  
              <tr class="subtotal-line">
                <td class="subtotal-line__title">
                  <p>
                    {% if transaction.status == "failure" %}
                      <img src="{{ 'notifications/critical-large.png' | shopify_asset_url }}" class="subtotal-line__icon" />
                    {% endif %}
                    <span>{{ title }}</span>
                  </p>
                </td>
                <td class="subtotal-line__value">
                  {% if transaction.status == "failure" %}
                    <span class="subtotal-line__value--error">{{ 0 | money }}</span>
                  {% else %}
                    <span>{{ transaction.amount | money }}</span>
                  {% endif %}
                </td>
              </tr>
            {% endfor %}
          </table>
        </td>
      </tr>
    </table>
  {% endif %}
  
          <table class="row subtotal-lines">
    <tr>
      {% if total_price > total_outstanding %}
      <td class="subtotal-spacer"></td>
        <td>
          <table class="row subtotal-table">
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום מעודכן</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_price | money }}</strong>
    </td>
  </tr>
  
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>כבר שולם</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ net_payment | money }}</strong>
    </td>
  </tr>
  
          </table>
          <table class="row subtotal-table subtotal-table--total">
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום לתשלום</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_outstanding | money_with_currency }}</strong>
    </td>
  </tr>
  
          </table>
        </td>
      {% else %}
        <table class="row subtotal-table subtotal-table--total">
          
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום לתשלום</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_outstanding | money_with_currency }}</strong>
    </td>
  </tr>
  
        </table>
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
  
        {% if shipping_address or billing_address or shipping_method or company_location or payment_terms%}
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
              {% if shipping_address %}
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
            <tr>
              {% if company_location %}
                <td class="customer-info__item">
                  <h4>מיקום</h4>
                  <p>
                    {{ company_location.name }}
                  </p>
                </td>
              {% endif %}
  
              {% if payment_terms %}
                <td class="customer-info__item">
                  <h4>תשלום</h4>
                  {% assign due_date = payment_terms.next_payment.due_at | default: nil %}
                  {% if payment_terms.type == 'receipt' or payment_terms.type == 'fulfillment' and payment_terms.next_payment.due_at == nil %}
                    {{ payment_terms.translated_name }}
                  {% else %}
                    {{ payment_terms.translated_name }}: תאריך פירעון {{ due_date | date: format: 'date' }}
                  {% endif %}
                </td>
              {% endif %}
            </tr>
            <tr>
              {% if shipping_method %}
                <td class="customer-info__item customer-info__item--last">
                  <h4>שיטת משלוח</h4>
                  <p>{{ shipping_method.title }}<br/>{{ shipping_method.price | money }}</p>
                </td>
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
        {% endif %}
  
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
  `,
  },

  {
    id: "pending_payment_success",
    title: "הצלחת תשלום ממתין",
    subject: `[{{ shop.name }}] התשלום עבור {{ name }} התקבל`,
    body: `{% capture email_title %}התשלום שלך עבור {{ order.name }} התקבל{% endcapture %}
    
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
                        {%- if shop.email_logo_url %}
                          <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
    
              {% assign gift_card_line_item = line_items | where: "gift_card" %}
              {% if gift_card_line_item.first %}
                <table class="row section">
      <tr>
        <td class="section__cell">
          <center>
            <table class="container">
              <tr>
                <td>
                  <h3>כרטיס מתנה</h3>
                </td>
              </tr>
            </table>
            <table class="container">
              <tr>
                <td>
                  
                  <p>תקבל/י מיילים נפרדים עבור כרטיסי מתנה.</p>
    
                </td>
              </tr>
            </table>
          </center>
        </td>
      </tr>
    </table>
              {% endif %}
    
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
                {{ line.quantity }} מתוך {{ line.quantity }}
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
      {% for line_item_group in line_item_groups %}
        
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
                          חינם
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
    
                      {% if line_item_group.deliverable? %}
                        <span class="order-list__item-title">{{ component_title }}&nbsp;&times;&nbsp;{{ component.quantity }}</span><br/>
                      {% else %}
                        <span class="order-list__item-title">{{ component.quantity }}&nbsp;&times;&nbsp;{{ component_title }}</span><br/>
                      {% endif %}
    
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
      {% endfor %}
    </table>
    
                <table class="row subtotal-lines">
      <tr>
        <td class="subtotal-spacer"></td>
        <td>
          <table class="row subtotal-table">
    
            
    {% assign total_order_discount_amount = 0 %}
    {% assign has_shipping_discount = false %}
    {% assign epsilon = 0.00001 %}
    
    {% for discount_application in discount_applications %}
      {% if discount_application.target_selection == 'all' and discount_application.target_type == 'line_item' %}
        {% assign order_discount_count = order_discount_count | plus: 1 %}
        {% assign total_order_discount_amount = total_order_discount_amount | plus: discount_application.total_allocated_amount %}
      {% endif %}
      {% if discount_application.target_type == 'shipping_line' %}
        {% assign has_shipping_discount = true %}
        {% assign shipping_discount_title = discount_application.title %}
        {% assign discount_value_price = discount_application.total_allocated_amount %}
        {% assign shipping_amount_minus_discount_value_price = shipping_price | minus: discount_value_price %}
        {% assign shipping_amount_minus_discount_value_price_abs = shipping_amount_minus_discount_value_price | abs %}
        {% assign discount_application_value_type = discount_application.value_type | strip %}
        {% if shipping_amount_minus_discount_value_price_abs < epsilon or discount_application_value_type == 'percentage' and discount_application.value == 100 %}
          {% assign free_shipping = true %}
        {% else %}
          {% assign discounted_shipping_price = shipping_amount_minus_discount_value_price %}
        {% endif %}
      {% endif %}
    {% endfor %}
    
    
    
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>סכום ביניים</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ subtotal_price | plus: total_order_discount_amount | money }}</strong>
      </td>
    </tr>
    
    
    
    {% if order_discount_count > 0 %}
      {% if order_discount_count == 1 %}
        
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>הנחת הזמנה</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>-{{ total_order_discount_amount | money }}</strong>
      </td>
    </tr>
    
      {% endif %}
      {% if order_discount_count > 1 %}
        
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>הנחות הזמנה</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>-{{ total_order_discount_amount | money }}</strong>
      </td>
    </tr>
    
      {% endif %}
      {% for discount_application in discount_applications %}
        {% if discount_application.target_selection == 'all' and discount_application.target_type != 'shipping_line' %}
          <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span class="subtotal-line__discount">
            <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
            <span class="subtotal-line__discount-title">
                {{ discount_application.title }} (-{{ discount_application.total_allocated_amount | money }})
            </span>
          </span>
        </p>
      </td>
    </tr>
    
        {% endif %}
      {% endfor %}
    {% endif %}
    
    
            {% unless retail_delivery_only %}
              {% if delivery_method == 'pick-up' %}
                
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>איסוף</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ shipping_price | money }}</strong>
      </td>
    </tr>
    
              {% else %}
                {% if has_shipping_discount %}
      {% if free_shipping == true %}
        
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>משלוח</span>
        </p>
      </td>
      <td class="subtotal-line__value">
        <del>{% if shipping_price != 0 %}{{ shipping_price | money}}{% endif %} </del>
          <strong>חינם</strong>
      </td>
    </tr>
    
      {% else %}
        
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>משלוח</span>
        </p>
      </td>
      <td class="subtotal-line__value">
        <del>{{ shipping_price | money }} </del>
          <strong>{{ discounted_shipping_price | money }}</strong>
      </td>
    </tr>
    
      {% endif %}
      <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span class="subtotal-line__discount">
            <img src="{{ 'notifications/discounttag.png' | shopify_asset_url }}" width="18" height="18" class="discount-tag-icon" />
            <span class="subtotal-line__discount-title">
                {{ shipping_discount_title }} 
                {% if discount_value_price != 0 %}
                  (-{{ discount_value_price | money }})
                {% endif %}
            </span>
          </span>
        </p>
      </td>
    </tr>
    
    {% else %}
      
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>משלוח</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ shipping_price | money }}</strong>
      </td>
    </tr>
    
    {% endif %}
    
              {% endif %}
            {% endunless %}
    
            {% if total_duties %}
              
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>מכס</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ total_duties | money }}</strong>
      </td>
    </tr>
    
            {% endif %}
    
            
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>מסים</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ tax_price | money }}</strong>
      </td>
    </tr>
    
    
            {% if total_tip and total_tip > 0 %}
              
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>טיפ</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ total_tip | money }}</strong>
      </td>
    </tr>
    
            {% endif %}
          </table>
    
          {% assign transaction_size = 0 %}
          {% assign transaction_amount = 0 %}
          {% assign net_transaction_amount_rounding = 0 %}
          {% assign authorized_amount = 0 %}
          {% assign has_refunds = false %}
          {% assign shopify_pay_captured = false %}
          {% assign shop_cash_offers_captured = false %}
          {% for transaction in transactions %}
            {% if transaction.status == "success" %}
              {% if transaction.kind == "sale" or transaction.kind == "capture"  %}
                  {% if transaction.payment_details.credit_card_company %}
                    {% assign shopify_pay_captured = true %}
                  {% endif %}
                  {% if transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                    {% assign shop_cash_offers_captured = true %}
                  {% endif %}
                  {% assign transaction_size = transaction_size | plus: 1 %}
                  {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
                  {% if transaction.amount_rounding != nil %}
                    {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
                  {% endif %}
              {% elsif transaction.kind == "refund" or transaction.kind == "change" %}
                {% assign transaction_size = transaction_size | plus: 1 %}
                {% assign transaction_amount = transaction_amount | minus: transaction.amount %}
                {% assign has_refunds = true %}
                {% if transaction.amount_rounding != nil %}
                  {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | minus: transaction.amount_rounding %}
                {% endif %}
              {% elsif transaction.kind == "authorization" %}
                {% assign authorized_amount = authorized_amount | plus: transaction.amount %}
              {% endif %}
            {% endif %}
          {% endfor %}
    
          {% # Add shop cash/offer transactions to totals if shopify pay is captured and shop cash/offer is not captured yet %}
          {% if shopify_pay_captured == true and shop_cash_offers_captured == false %}
            {% for transaction in transactions %}
            {% if transaction.status == "success" %}
              {% if transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                  {% assign transaction_size = transaction_size | plus: 1 %}
                  {% assign transaction_amount = transaction_amount | plus: transaction.amount %}
                  {% if transaction.amount_rounding != nil %}
                    {% assign net_transaction_amount_rounding = net_transaction_amount_rounding | plus: transaction.amount_rounding %}
                  {% endif %}
              {% endif %}
            {% endif %}
          {% endfor %}
          {% endif %}
          <table class="row subtotal-table subtotal-table--total">
          {% if payment_terms and payment_terms.automatic_capture_at_fulfillment == false or b2b? %}
            {% assign next_payment = payment_terms.next_payment %}
            {% assign due_at_date = next_payment.due_at | date: "%b %d, %Y" %}
            {% if net_transaction_amount_rounding != 0 %}
              
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>סה"כ</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ total_price | money_with_currency }}</strong>
      </td>
    </tr>
    
              {% if total_discounts > 0 %}
                <tr class="subtotal-line">
                  <td></td>
                  <td class="subtotal-line__value total-discount">
                      חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
                  </td>
                </tr>
              {% endif %}
              <tr><td colspan="2" class="subtotal-table__line"></td></tr>
              <div class="subtotal-line__value-small">
                
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>עיגול מזומן</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
      </td>
    </tr>
    
              </div>
              <tr><td colspan="2" class="subtotal-table__line"></td></tr>
            {% endif %}
            
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>סכום ששולם היום</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
      </td>
    </tr>
    
            <div class="payment-terms">
              {% assign next_amount_due = total_price %}
              {% if next_payment %}
                {% assign next_amount_due = next_payment.amount_due %}
              {% elsif total_outstanding > 0 %}
                {% assign next_amount_due = total_outstanding %}
              {% endif %}
    
              {% if payment_terms.type == 'receipt' %}
                
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>סכום לתשלום עם הקבלה</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ next_amount_due | money_with_currency }}</strong>
      </td>
    </tr>
    
              {% elsif payment_terms.type == 'fulfillment' %}
                
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>סכום לתשלום עם המילוי</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ next_amount_due | money_with_currency }}</strong>
      </td>
    </tr>
    
              {% else %}
                
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>סכום לתשלום {{ due_at_date }}</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ next_amount_due | money_with_currency }}</strong>
      </td>
    </tr>
    
              {% endif %}
            </div>
            {% if total_discounts > 0 and net_transaction_amount_rounding == 0 %}
              <tr class="subtotal-line">
                <td></td>
                <td class="subtotal-line__value total-discount">
                    חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
                </td>
              </tr>
            {% endif %}
          {% else %}
            
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>סה"כ</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ total_price | money_with_currency }}</strong>
      </td>
    </tr>
    
            {% if total_discounts > 0 %}
              <tr class="subtotal-line">
                <td></td>
                <td class="subtotal-line__value total-discount">
                    חסכת <span class="total-discount--amount">{{ total_discounts | money }}</span>
                </td>
              </tr>
            {% endif %}
            {% if net_transaction_amount_rounding != 0 %}
              <tr><td colspan="2" class="subtotal-table__line"></td></tr>
              <div class="subtotal-line__value-small">
                
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>עיגול מזומן</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{% if net_transaction_amount_rounding < 0 %}-{% endif %} {{ net_transaction_amount_rounding | abs | money }}</strong>
      </td>
    </tr>
    
              </div>
              {% if financial_status == 'paid' %}
                
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>שולם</span>
            <br>
            <small>{{ order.transactions | map: 'gateway_display_name' | uniq | join: ', ' }}</small>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
      </td>
    </tr>
    
              {% endif %}
            {% endif %}
            {% if transaction_amount != total_price and payment_terms == nil%}
              {% if transaction_amount == 0 and authorized_amount > 0 and has_refunds == false %}
              {% else %}
                <div class="payment-terms">
                  
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>סכום ששולם היום</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ transaction_amount | plus: net_transaction_amount_rounding | money_with_currency }}</strong>
      </td>
    </tr>
    
                </div>
              {% endif %}
            {% endif %}
          {% endif %}
          </table>
    
          {% unless payment_terms %}
          {% if transaction_size > 1 or transaction_amount < total_price %}
            <table class="row subtotal-table">
              <tr><td colspan="2" class="subtotal-table__line"></td></tr>
              <tr><td colspan="2" class="subtotal-table__small-space"></td></tr>
    
              {% for transaction in transactions %}
                {% assign amount_rounding = 0 %}
                {% if transaction.amount_rounding != 0 %}
                  {% assign amount_rounding =  transaction.amount_rounding %}
                {% endif %}
                {% if transaction.status == "success" and transaction.kind == "capture" or transaction.kind == "sale" %}
                  {% if transaction.payment_details.gift_card_last_four_digits %}
                    {% capture transaction_name %}כרטיס מתנה (מסתיים ב {{ transaction.payment_details.gift_card_last_four_digits }}){% endcapture %}
                  {% elsif transaction.payment_details.credit_card_company %}
                    {% capture transaction_name %}{{ transaction.payment_details.credit_card_company }} (מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }}){% endcapture %}
                  {% else %}
                    {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}
                  {% endif %}
    
                  
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>{{transaction_name}}</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
      </td>
    </tr>
    
                {% elsif shopify_pay_captured and shop_cash_offers_captured == false and transaction.kind == "authorization" and transaction.gateway == "shop_cash" or transaction.gateway == "shop_offer" %}
                  {% capture transaction_name %}{{ transaction.gateway_display_name }}{% endcapture %}
    
                  
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>{{transaction_name}}</span>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>{{ transaction.amount | plus: amount_rounding | money }}</strong>
      </td>
    </tr>
    
                {% endif %}
                {% if transaction.kind == 'refund' and transaction.gateway != "shop_offer" %}
                  {% if transaction.payment_details.gift_card_last_four_digits %}
                    {% assign refund_method_title = transaction.payment_details.type %}
                  {% elsif transaction.payment_details.credit_card_company %}
                    {% assign refund_method_title = transaction.payment_details.credit_card_company %}
                  {% else %}
                    {% assign refund_method_title = transaction.gateway_display_name %}
                  {% endif %}
    
                  
    <tr class="subtotal-line">
      <td class="subtotal-line__title">
        <p>
          <span>החזר</span>
            <br>
            <small>{{ refund_method_title | replace: '_', ' ' | capitalize }}</small>
        </p>
      </td>
      <td class="subtotal-line__value">
          <strong>- {{ transaction.amount | plus: amount_rounding | money }}</strong>
      </td>
    </tr>
    
                {% endif %}
              {% endfor %}
            </table>
          {% endif %}
    
    
          {% endunless %}
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
                    {% if transaction_size > 0 or payment_terms %}
                    <td class="customer-info__item">
                      <h4>תשלום</h4>
                      {% if payment_terms %}
                        {% assign due_date = payment_terms.next_payment.due_at | default: nil %}
                        {% if payment_terms.type == 'receipt' or payment_terms.type == 'fulfillment' and payment_terms.next_payment.due_at == nil %}
                          {{ payment_terms.translated_name }}<br>
                        {% else %}
                          {{ payment_terms.translated_name }}: תאריך פירעון {{ due_date | date: format: 'date' }}<br>
                        {% endif %}
                      {% endif %}
                      {% if transaction_size > 0 %}
                        {% for transaction in transactions %}
                          {% if transaction.status == "success" or transaction.status == "pending" %}
                            {% if transaction.kind == "capture" or transaction.kind == "sale" %}
                              {% if transaction.payment_details.gift_card_last_four_digits %}
                                <img src="{{ transaction.payment_details.type | downcase | replace: '_', '-'  | payment_type_img_url }}" class="customer-info__item-credit" height="24">
                                מסתיים ב {{ transaction.payment_details.gift_card_last_four_digits }}<br>
                              {% elsif transaction.payment_details.credit_card_company %}
                                <p class="customer-info__item-content">
                                  <img src="{{ transaction.payment_details.credit_card_company | payment_icon_png_url  }}" class="customer-info__item-credit" height="24" alt="{{ transaction.payment_details.credit_card_company }}">
                                  <span>מסתיים ב {{ transaction.payment_details.credit_card_last_four_digits }} &mdash; <strong>{{ transaction.amount | money }}</strong></span>
                                </p>
                              {% elsif transaction.gateway_display_name == "Gift card" %}
                                <p class="customer-info__item-content">
                                  <img src="{{ transaction.gateway_display_name | downcase | replace: ' ', '-'  | payment_type_img_url }}" class="customer-info__item-credit" height="24">
                                  מסתיים ב {{ transaction.payment_details.gift_card.last_four_characters | upcase }} &mdash; <strong>{{ transaction.amount | money }}</strong> <br />
                                  &emsp;&emsp;&emsp;&nbsp;יתרת כרטיס מתנה: {{ transaction.payment_details.gift_card.balance |  money }}
                                </p>
                              {% else %}
                                <p class="customer-info__item-content">
                                  {{ transaction.gateway_display_name }} &mdash; <strong>{{ transaction.amount | money }}</strong>
                                </p>
                              {% endif %}
                            {% endif %}
                          {% endif %}
                        {% endfor %}
                      {% endif %}
                    </td>
                    {% endif %}
                  </tr>
                  <tr>
                    {% if requires_shipping and shipping_address %}
                      {% if shipping_method %}
                      <td class="customer-info__item">
                        <h4>שיטת משלוח</h4>
                        <p>{{ shipping_method.title }}</p>
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
    
    `,
  },

  {
    id: "shipping_update",
    title: "עדכון משלוח",
    subject: `עדכון משלוח עבור הזמנה {{ name }}`,
    body: `{% capture email_title %}סטטוס המשלוח שלך עודכן{% endcapture %}
    {% capture email_body %}הפריטים הבאים עודכנו עם מידע משלוח חדש.{% endcapture %}
    
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
                        {%- if shop.email_logo_url %}
                          <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
                <p>{{ email_emphasis }}</p>
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
                {% if fulfillment.tracking_numbers.size > 0 %}
      <p class="disclaimer__subtext">
        <br/>
        {% if fulfillment.tracking_numbers.size == 1 and fulfillment.tracking_company and fulfillment.tracking_url %}
          מספר מעקב {{ fulfillment.tracking_company }}: <a href="{{ fulfillment.tracking_url }}">{{ fulfillment.tracking_numbers.first }}</a>
        {% elsif fulfillment.tracking_numbers.size == 1 %}
          מספר מעקב: {{ fulfillment.tracking_numbers.first }}
        {% else %}
          מספרי מעקב {{ fulfillment.tracking_company }}:<br />
          {% for tracking_number in fulfillment.tracking_numbers %}
            {% if fulfillment.tracking_urls[forloop.index0] %}
              <a href="{{ fulfillment.tracking_urls[forloop.index0] }}">
                {{ tracking_number }}
              </a>
            {% else %}
                {{ tracking_number }}
            {% endif %}
            <br/>
          {% endfor %}
        {% endif %}
      </p>
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
                  <h3>פריטים במשלוח הזה</h3>
                </td>
              </tr>
            </table>
            <table class="container">
              <tr>
                <td>
                  
                
      <table class="row">
        {% for line in fulfillment.fulfillment_line_items %}
          
    <tr class="order-list__item">
      <td class="order-list__item__cell">
        <table>
            {% assign expand_bundles = false %}
    
          {% if expand_bundles and line.line_item.bundle_parent? %}
            <td class="order-list__parent-image-cell">
              {% if line.line_item.image %}
                <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
              {% else %}
                <div class="order-list__no-image-cell">
                  <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
                </div>
              {% endif %}
            </td>
          {% else %}
            <td class="order-list__image-cell">
              {% if line.line_item.image %}
                <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
              {% else %}
                <div class="order-list__no-image-cell">
                  <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
                </div>
              {% endif %}
            </td>
          {% endif %}
          <td class="order-list__product-description-cell">
            {% if line.line_item.presentment_title %}
              {% assign line_title = line.line_item.presentment_title %}
            {% elsif line.line_item.title %}
              {% assign line_title = line.line_item.title %}
            {% else %}
              {% assign line_title = line.line_item.product.title %}
            {% endif %}
            {% if line.quantity < line.line_item.quantity %}
              {% capture line_display %}
                {{ line.quantity }} מתוך {{ line.line_item.quantity }}
              {% endcapture %}
            {% else %}
              {% assign line_display = line.line_item.quantity %}
            {% endif %}
    
            <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>
    
            {% if line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? == false %}
              <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
            {% elsif line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? and expand_bundles == false %}
              <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
            {% endif %}
    
            {% if expand_bundles %}
              {% for component in line.line_item.bundle_components %}
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
              {% for group in line.line_item.groups %}
                <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
              {% endfor %}
            {% endif %}
    
    
            {% if line.line_item.selling_plan_allocation %}
              <span class="order-list__item-variant">{{ line.line_item.selling_plan_allocation.selling_plan.name }}</span><br/>
            {% endif %}
    
            {% if line.line_item.refunded_quantity > 0 %}
              <span class="order-list__item-refunded">הוחזר</span>
            {% endif %}
    
            {% if line.line_item.discount_allocations %}
              {% for discount_allocation in line.line_item.discount_allocations %}
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
        </table>
      </td>
    </tr>
    
        {% endfor %}
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
    `,
  },

  {
    id: "out_for_delivery",
    title: "יצא למשלוח",
    subject: `משלוח מהזמנה {{ name }} יצא למשלוח`,
    body: `{% if fulfillment.item_count == item_count %} 
      {% capture email_title %}ההזמנה שלך יצאה למשלוח{% endcapture %}
      {% capture email_body %}ההזמנה שלך יצאה למשלוח. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
    {% elsif fulfillment.item_count > 1 %} 
      {% if fulfillment_status == 'fulfilled' %}
        {% capture email_title %}הפריטים האחרונים בהזמנה שלך יצאו למשלוח{% endcapture %}
        {% capture email_body %}הפריטים האחרונים בהזמנה שלך יצאו למשלוח. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
      {% else %}
        {% capture email_title %}חלק מהפריטים בהזמנה שלך יצאו למשלוח{% endcapture %}
        {% capture email_body %}חלק מהפריטים בהזמנה שלך יצאו למשלוח. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
      {% endif %}
    {% else %} 
      {% if fulfillment_status == 'fulfilled' %}
        {% capture email_title %}הפריט האחרון בהזמנה שלך יצא למשלוח{% endcapture %}
        {% capture email_body %}הפריט האחרון בהזמנה שלך יצא למשלוח. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
      {% else %}
        {% capture email_title %}פריט אחד מההזמנה שלך יצא למשלוח{% endcapture %}
        {% capture email_body %}פריט אחד מההזמנה שלך יצא למשלוח. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
      {% endif %}
    {% endif %}
    
    
    {% capture email_emphasis %}תאריך אספקה משוער: <strong>{{fulfillment.estimated_delivery_at | date: format: 'date'}}</strong>{% endcapture %}
    
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
                        {%- if shop.email_logo_url %}
                          <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
                {% if fulfillment.estimated_delivery_at %}
                  <p>{{ email_emphasis }}</p>
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
              <td class="button__cell"><a href="{{ order_status_url }}" class="button__text">עקוב אחר המשלוח</a></td>
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
                {% if fulfillment.tracking_numbers.size > 0 %}
      <p class="disclaimer__subtext">
        <br/>
        {% if fulfillment.tracking_numbers.size == 1 and fulfillment.tracking_company and fulfillment.tracking_url %}
          מספר מעקב {{ fulfillment.tracking_company }}: <a href="{{ fulfillment.tracking_url }}">{{ fulfillment.tracking_numbers.first }}</a>
        {% elsif fulfillment.tracking_numbers.size == 1 %}
          מספר מעקב: {{ fulfillment.tracking_numbers.first }}
        {% else %}
          מספרי מעקב {{ fulfillment.tracking_company }}:<br />
          {% for tracking_number in fulfillment.tracking_numbers %}
            {% if fulfillment.tracking_urls[forloop.index0] %}
              <a href="{{ fulfillment.tracking_urls[forloop.index0] }}">
                {{ tracking_number }}
              </a>
            {% else %}
                {{ tracking_number }}
            {% endif %}
            <br/>
          {% endfor %}
        {% endif %}
      </p>
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
                  <h3>פריטים במשלוח הזה</h3>
                </td>
              </tr>
            </table>
            <table class="container">
              <tr>
                <td>
                  
                
      <table class="row">
        {% for line in fulfillment.fulfillment_line_items %}
          
    <tr class="order-list__item">
      <td class="order-list__item__cell">
        <table>
            {% assign expand_bundles = false %}
    
          {% if expand_bundles and line.line_item.bundle_parent? %}
            <td class="order-list__parent-image-cell">
              {% if line.line_item.image %}
                <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
              {% else %}
                <div class="order-list__no-image-cell">
                  <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
                </div>
              {% endif %}
            </td>
          {% else %}
            <td class="order-list__image-cell">
              {% if line.line_item.image %}
                <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
              {% else %}
                <div class="order-list__no-image-cell">
                  <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
                </div>
              {% endif %}
            </td>
          {% endif %}
          <td class="order-list__product-description-cell">
            {% if line.line_item.presentment_title %}
              {% assign line_title = line.line_item.presentment_title %}
            {% elsif line.line_item.title %}
              {% assign line_title = line.line_item.title %}
            {% else %}
              {% assign line_title = line.line_item.product.title %}
            {% endif %}
            {% if line.quantity < line.line_item.quantity %}
              {% capture line_display %}
                {{ line.quantity }} מתוך {{ line.line_item.quantity }}
              {% endcapture %}
            {% else %}
              {% assign line_display = line.line_item.quantity %}
            {% endif %}
    
            <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>
    
            {% if line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? == false %}
              <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
            {% elsif line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? and expand_bundles == false %}
              <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
            {% endif %}
    
            {% if expand_bundles %}
              {% for component in line.line_item.bundle_components %}
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
              {% for group in line.line_item.groups %}
                <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
              {% endfor %}
            {% endif %}
    
    
            {% if line.line_item.selling_plan_allocation %}
              <span class="order-list__item-variant">{{ line.line_item.selling_plan_allocation.selling_plan.name }}</span><br/>
            {% endif %}
    
            {% if line.line_item.refunded_quantity > 0 %}
              <span class="order-list__item-refunded">הוחזר</span>
            {% endif %}
    
            {% if line.line_item.discount_allocations %}
              {% for discount_allocation in line.line_item.discount_allocations %}
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
        </table>
      </td>
    </tr>
    
        {% endfor %}
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
    `,
  },

  {
    id: "delivered",
    title: "נמסר",
    subject: `משלוח מהזמנה {{ name }} נמסר`,
    body: `{% if fulfillment.item_count == item_count %} 
      {% capture email_title %}ההזמנה שלך נמסרה{% endcapture %}
      {% capture email_body %}ההזמנה שלך נמסרה. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
    {% elsif fulfillment.item_count > 1 %} 
      {% if fulfillment_status == 'fulfilled' %}
        {% capture email_title %}הפריטים האחרונים בהזמנה שלך נמסרו{% endcapture %}
        {% capture email_body %}הפריטים האחרונים בהזמנה שלך נמסרו. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
      {% else %}
        {% capture email_title %}חלק מהפריטים בהזמנה שלך נמסרו{% endcapture %}
        {% capture email_body %}חלק מהפריטים בהזמנה שלך נמסרו. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
      {% endif %}
    {% else %} 
      {% if fulfillment_status == 'fulfilled' %}
        {% capture email_title %}הפריט האחרון בהזמנה שלך נמסר{% endcapture %}
        {% capture email_body %}הפריט האחרון בהזמנה שלך נמסר. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
      {% else %}
        {% capture email_title %}פריט אחד מההזמנה שלך נמסר{% endcapture %}
        {% capture email_body %}פריט אחד מההזמנה שלך נמסר. עקוב אחר המשלוח כדי לראות את סטטוס המשלוח.{% endcapture %}
      {% endif %}
    {% endif %}
    
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
                        {%- if shop.email_logo_url %}
                          <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
                <table class="text-icon-container">
                  <tr class="text-icon-row">
                    <td class="text-icon"><img src="{{ 'notifications/question.png' | shopify_asset_url }}" class="text-icon__image"></td>
                    <td class="text">
                      <p>לא קיבלת את החבילה עדיין? <a href="mailto:{{ shop.email }}">דווח לנו</a></p>
                    </td>
                  </tr>
                </table>
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
                {% if fulfillment.tracking_numbers.size > 0 %}
      <p class="disclaimer__subtext">
        <br/>
        {% if fulfillment.tracking_numbers.size == 1 and fulfillment.tracking_company and fulfillment.tracking_url %}
          מספר מעקב {{ fulfillment.tracking_company }}: <a href="{{ fulfillment.tracking_url }}">{{ fulfillment.tracking_numbers.first }}</a>
        {% elsif fulfillment.tracking_numbers.size == 1 %}
          מספר מעקב: {{ fulfillment.tracking_numbers.first }}
        {% else %}
          מספרי מעקב {{ fulfillment.tracking_company }}:<br />
          {% for tracking_number in fulfillment.tracking_numbers %}
            {% if fulfillment.tracking_urls[forloop.index0] %}
              <a href="{{ fulfillment.tracking_urls[forloop.index0] }}">
                {{ tracking_number }}
              </a>
            {% else %}
                {{ tracking_number }}
            {% endif %}
            <br/>
          {% endfor %}
        {% endif %}
      </p>
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
                  <h3>פריטים במשלוח הזה</h3>
                </td>
              </tr>
            </table>
            <table class="container">
              <tr>
                <td>
                  
                
      <table class="row">
        {% for line in fulfillment.fulfillment_line_items %}
          
    <tr class="order-list__item">
      <td class="order-list__item__cell">
        <table>
            {% assign expand_bundles = false %}
    
          {% if expand_bundles and line.line_item.bundle_parent? %}
            <td class="order-list__parent-image-cell">
              {% if line.line_item.image %}
                <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
              {% else %}
                <div class="order-list__no-image-cell">
                  <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
                </div>
              {% endif %}
            </td>
          {% else %}
            <td class="order-list__image-cell">
              {% if line.line_item.image %}
                <img src="{{ line.line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
              {% else %}
                <div class="order-list__no-image-cell">
                  <img src="{{ 'notifications/no-image.png' | shopify_asset_url }}" align="left" width="60" height="60" class="order-list__no-product-image"/>
                </div>
              {% endif %}
            </td>
          {% endif %}
          <td class="order-list__product-description-cell">
            {% if line.line_item.presentment_title %}
              {% assign line_title = line.line_item.presentment_title %}
            {% elsif line.line_item.title %}
              {% assign line_title = line.line_item.title %}
            {% else %}
              {% assign line_title = line.line_item.product.title %}
            {% endif %}
            {% if line.quantity < line.line_item.quantity %}
              {% capture line_display %}
                {{ line.quantity }} מתוך {{ line.line_item.quantity }}
              {% endcapture %}
            {% else %}
              {% assign line_display = line.line_item.quantity %}
            {% endif %}
    
            <span class="order-list__item-title">{{ line_title }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>
    
            {% if line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? == false %}
              <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
            {% elsif line.line_item.variant.title != 'Default Title' and line.line_item.bundle_parent? and expand_bundles == false %}
              <span class="order-list__item-variant">{{ line.line_item.variant.title }}</span><br/>
            {% endif %}
    
            {% if expand_bundles %}
              {% for component in line.line_item.bundle_components %}
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
              {% for group in line.line_item.groups %}
                <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span><br/>
              {% endfor %}
            {% endif %}
    
    
            {% if line.line_item.selling_plan_allocation %}
              <span class="order-list__item-variant">{{ line.line_item.selling_plan_allocation.selling_plan.name }}</span><br/>
            {% endif %}
    
            {% if line.line_item.refunded_quantity > 0 %}
              <span class="order-list__item-refunded">הוחזר</span>
            {% endif %}
    
            {% if line.line_item.discount_allocations %}
              {% for discount_allocation in line.line_item.discount_allocations %}
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
        </table>
      </td>
    </tr>
    
        {% endfor %}
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
    `,
  },
    {
    id: "return_created",
    title: "החזרה נוצרה",
    subject: `השלם את ההחזרה שלך עבור הזמנה {{ order.name }}`,
    body: `<!DOCTYPE html>
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
                      {%- if shop.email_logo_url %}
                        <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
                                הזמנה {{ order.name }}
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
                
            {% for return_delivery in return.deliveries %}
              {% if return_delivery.type == 'shopify_label' %}
                <h2>תווית המשלוח להחזרה שלך מוכנה</h2>
                <p class="return-creation__subtitle">הדפס את תווית המשלוח להחזרה והדבק אותה על החבילה המכילה את הפריטים המוחזרים</p>
  
                <div class="return-label-beta__instructions">
                  <h2>הוראות</h2>
  
                  <ol>
                    <li>ארוז את הפריטים שאתה מחזיר.</li>
                    {% if return.checkout_payment_collection_url %}
                      <li>שלם את היתרה הפתוחה.</li>
                    {% endif %}
                    <li>הדפס את תווית המשלוח להחזרה והדבק אותה על החבילה. כסה או הסר תוויות משלוח ישנות.</li>
                    <li>
                      {% if return_delivery.carrier_name %}
                        מסור את החבילה ל{{ return_delivery.carrier_name }}.
                      {% else %}
                        מסור את החבילה לחברת המשלוחים המצוינת על התווית.
                      {% endif %}
                    </li>
                  </ol>
                </div>
  
                {% capture url_primary %}{{ return_delivery.return_label.public_file_url }}{% endcapture %}
  {% capture text_primary %}הדפס תווית החזרה{% endcapture %}
  {% capture url_secondary %}{{ return.checkout_payment_collection_url }}{% endcapture %}
  {% capture text_secondary %}שלם עכשיו{% endcapture %}
  
  <table class="row actions">
    <tr>
      <td class="empty-line">&nbsp;</td>
    </tr>
    <tr>
      <td class="actions__cell">
        {% if url_primary != blank or url_secondary != blank %}
          {% if url_primary != blank %}
        <table class="button main-action-cell">
          <tr>
            <td class="button__cell">
              <a href="{{ url_primary }}" class="button__text">{{ text_primary }}</a>
            </td>
          </tr>
        </table>
          {% endif %}
          {% if url_secondary != blank %}
        <table class="button return__mobile-padding main-action-cell">
          <tr>
            <td class="button__cell">
              <a href="{{ url_secondary }}" class="button__text return__main-button">{{ text_secondary }}</a>
            </td>
          </tr>
        </table>
          {% endif %}
        <table class="link secondary-action-cell">
          <tr>
            <td class="link__cell">או <a target="_blank" href="{{ order.order_status_url }}">צפה בהזמנה שלך</a></td>
          </tr>
        </table>
        {% else %}
        <table class="button main-action-cell">
          <tr>
            <td class="button__cell"><a href="{{ order.order_status_url }}" class="button__text">צפה בהזמנה שלך</a></td>
          </tr>
        </table>
        {% endif %}
      </td>
    </tr>
  </table>
  
              {% elsif return_delivery.type == 'manual' %}
                <h2>השלם את ההחזרה שלך</h2>
                <p class="return-creation__subtitle">
                  <b class="return-creation__subtitle-bold">שלחנו לך תווית משלוח להחזרה, או שתקבל אחת בקרוב.</b>
                  לאחר שתקבל את תווית המשלוח להחזרה, קח את הפריטים המוחזרים ופעל לפי ההוראות כדי להשלים את ההחזרה.
                </p>
  
                <div class="return-label-beta__instructions">
                  <h2>הוראות</h2>
  
                  <ol>
                    <li>ארוז את הפריטים שאתה מחזיר.</li>
                    {% if return.checkout_payment_collection_url %}
                      <li>שלם את היתרה הפתוחה.</li>
                    {% endif %}
                    <li>הדפס את תווית המשלוח להחזרה. אם עדיין לא קיבלת אותה, נשלח לך בקרוב.</li>
                    <li>הדבק את התווית על החבילה. כסה או הסר תוויות משלוח ישנות.</li>
                    <li>
                      {% if return_delivery.carrier_name %}
                        מסור את החבילה ל{{ return_delivery.carrier_name }}.
                      {% else %}
                        מסור את החבילה לחברת המשלוחים המצוינת על התווית.
                      {% endif %}
                    </li>
                    <li>
                      {% if return_delivery.tracking_url != blank %}
                        עקוב אחר ההחזרה שלך באמצעות <a target="_blank" style="text-decoration: underline" href="{{ return_delivery.tracking_url }}">מספר המעקב שלך</a> כדי לוודא שאנחנו מקבלים אותה.
                      {% else %}
                        עקוב אחר ההחזרה שלך באמצעות מספר המעקב שלך כדי לוודא שאנחנו מקבלים אותה.
                      {% endif %}
                    </li>
                  </ol>
                </div>
  
                {% capture url_primary %}{{ return.checkout_payment_collection_url }}{% endcapture %}
  {% capture text_primary %}שלם עכשיו{% endcapture %}
  {% capture url_secondary %}{% endcapture %}
  {% capture text_secondary %}{% endcapture %}
  
  <table class="row actions">
    <tr>
      <td class="empty-line">&nbsp;</td>
    </tr>
    <tr>
      <td class="actions__cell">
        {% if url_primary != blank or url_secondary != blank %}
          {% if url_primary != blank %}
        <table class="button main-action-cell">
          <tr>
            <td class="button__cell">
              <a href="{{ url_primary }}" class="button__text">{{ text_primary }}</a>
            </td>
          </tr>
        </table>
          {% endif %}
          {% if url_secondary != blank %}
        <table class="button return__mobile-padding main-action-cell">
          <tr>
            <td class="button__cell">
              <a href="{{ url_secondary }}" class="button__text return__main-button">{{ text_secondary }}</a>
            </td>
          </tr>
        </table>
          {% endif %}
        <table class="link secondary-action-cell">
          <tr>
            <td class="link__cell">או <a target="_blank" href="{{ order.order_status_url }}">צפה בהזמנה שלך</a></td>
          </tr>
        </table>
        {% else %}
        <table class="button main-action-cell">
          <tr>
            <td class="button__cell"><a href="{{ order.order_status_url }}" class="button__text">צפה בהזמנה שלך</a></td>
          </tr>
        </table>
        {% endif %}
      </td>
    </tr>
  </table>
  
              {% endif %}
            {% endfor %}
  
              </td>
            </tr>
          </table>
        </center>
      </td>
    </tr>
  </table>
  
          {% if return.line_items.size > 0 %}
            <table class="row content">
    <tr>
      <td class="content__cell">
        <center>
          <table class="container">
            <tr>
              <td>
                
              <h2>פריטים להחזרה</h2>
              
  <table class="row">
    {% for line_item in return.line_items %}
    <tr class="order-list__item">
      <td class="order-list__item__cell">
        <table>
          <td>
            {% if line_item.image %}
              <img src="{{ line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
            {% endif %}
          </td>
          <td class="order-list__product-description-cell">
            {% assign line_display = line_item.quantity  %}
  
            <span class="order-list__item-title">{{ line_item.title_without_variant }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>
  
            {% if line_item.variant.present? and line_item.variant.title != 'Default Title' %}
              <span class="order-list__item-variant">{{ line_item.variant.title }}</span><br/>
            {% endif %}
  
            {% for group in line_item.groups %}
              <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span>
              <br/>
            {% endfor %}
  
            {% if line_item.discount_allocations %}
              {% for discount_allocation in line_item.discount_allocations %}
                {% if discount_allocation.amount > 0 %}
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
  
          <td class="order-list__price-cell">
            {% if line_item.original_line_price != line_item.final_line_price %}
              <del class="order-list__item-original-price">{{ line_item.original_line_price | money }}</del>
            {% endif %}
            <p class="order-list__item-price">
              {% if line_item.final_line_price > 0 %}
                {% capture final_line_price %}
                    -{{ line_item.final_line_price | money }}
                {% endcapture %}
                {{ final_line_price }}
                {% if line_item.unit_price_measurement %}
    <div class="order-list__unit-price">
      {{- line_item.unit_price | unit_price_with_measurement: line_item.unit_price_measurement -}}
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
    {% endfor %}
  </table>
  
              </td>
            </tr>
          </table>
        </center>
      </td>
    </tr>
  </table>
          {% endif %}
  
          {% if return.exchange_line_items.size > 0 %}
            <table class="row content">
    <tr>
      <td class="content__cell">
        <center>
          <table class="container">
            <tr>
              <td>
                
              <h2>פריטים שתקבל</h2>
              
  <table class="row">
    {% for line_item in return.exchange_line_items %}
    <tr class="order-list__item">
      <td class="order-list__item__cell">
        <table>
          <td>
            {% if line_item.image %}
              <img src="{{ line_item | img_url: 'compact_cropped' }}" align="left" width="60" height="60" class="order-list__product-image"/>
            {% endif %}
          </td>
          <td class="order-list__product-description-cell">
            {% assign line_display = line_item.quantity  %}
  
            <span class="order-list__item-title">{{ line_item.title_without_variant }}&nbsp;&times;&nbsp;{{ line_display }}</span><br/>
  
            {% if line_item.variant.present? and line_item.variant.title != 'Default Title' %}
              <span class="order-list__item-variant">{{ line_item.variant.title }}</span><br/>
            {% endif %}
  
            {% for group in line_item.groups %}
              <span class="order-list__item-variant">חלק מ: {{ group.display_title }}</span>
              <br/>
            {% endfor %}
  
            {% if line_item.discount_allocations %}
              {% for discount_allocation in line_item.discount_allocations %}
                {% if discount_allocation.amount > 0 %}
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
  
          <td class="order-list__price-cell">
            {% if line_item.original_line_price != line_item.final_line_price %}
              <del class="order-list__item-original-price">{{ line_item.original_line_price | money }}</del>
            {% endif %}
            <p class="order-list__item-price">
              {% if line_item.final_line_price > 0 %}
                {% capture final_line_price %}
                    {{ line_item.final_line_price | money }}
                {% endcapture %}
                {{ final_line_price }}
                {% if line_item.unit_price_measurement %}
    <div class="order-list__unit-price">
      {{- line_item.unit_price | unit_price_with_measurement: line_item.unit_price_measurement -}}
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
    {% endfor %}
  </table>
  
              </td>
            </tr>
          </table>
        </center>
      </td>
    </tr>
  </table>
          {% endif %}
  
          <table class="row content">
    <tr>
      <td class="content__cell">
        <center>
          <table class="container">
            <tr>
              <td>
                
            <table class="row subtotal-lines">
    <tr>
      <td class="subtotal-spacer"></td>
      <td>
        <table class="row subtotal-table">
  
          {% capture line_items_subtotal_price %}
            {% if return.line_items_subtotal_price < 0 %}
              -{{ return.line_items_subtotal_price  | abs | money }}
            {% else %}
              {{ return.line_items_subtotal_price | money }}
            {% endif %}
          {% endcapture %}
  
          
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום ביניים</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ line_items_subtotal_price }}</strong>
    </td>
  </tr>
  
          {% assign fees = return.fees %}
          {% for fee in fees %}
    
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>{{ fee.title }}</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ fee.subtotal | money }}</strong>
    </td>
  </tr>
  
  {% endfor %}
  
          {% if return.total_tax_price %}
            {% capture total_tax_price %}
              {% if return.total_tax_price < 0 %}
                -{{ return.total_tax_price | abs | money }}
              {% else %}
                {{ return.total_tax_price | money }}
              {% endif %}
            {% endcapture %}
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>מסים משוערים</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ total_tax_price }}</strong>
    </td>
  </tr>
  
          {% endif %}
  
          {%  if return.pre_return_order_total_outstanding and return.pre_return_order_total_outstanding != 0 %}
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>יתרה פתוחה</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ return.pre_return_order_total_outstanding | money_with_currency }}</strong>
    </td>
  </tr>
  
          {% endif %}
  
          {% if return.order_total_outstanding > 0 %}
          <table class="row subtotal-table subtotal-table--total">
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>סכום משוער לתשלום</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ return.order_total_outstanding | money_with_currency }}</strong>
    </td>
  </tr>
  
          </table>
          {% elsif return.order_total_outstanding <= 0 %}
          <table class="row subtotal-table subtotal-table--total">
            
  <tr class="subtotal-line">
    <td class="subtotal-line__title">
      <p>
        <span>החזר משוער</span>
      </p>
    </td>
    <td class="subtotal-line__value">
        <strong>{{ return.order_total_outstanding | abs | money_with_currency }}</strong>
    </td>
  </tr>
  
          </table>
          {% endif %}
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
  `
  },

  {
      id: "order_level_return_label_created",
      title: "תווית החזרה ברמת הזמנה נוצרה",
      subject: `תווית החזרה עבור הזמנה {{ order.name }}`,
      body: `<!DOCTYPE html>
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
                      {%- if shop.email_logo_url %}
                        <img src="{{shop.email_logo_url}}" alt="{{ shop.name }}" width="{{ shop.email_logo_width }}">
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
                                הזמנה {{ order.name }}
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
                
              <h2>תווית ההחזרה שלך מוכנה</h2>
              <table class="row actions">
    <tr>
      <td class="empty-line">&nbsp;</td>
    </tr>
    <tr>
      <td class="actions__cell">
        <table class="button main-action-cell">
          <tr>
            <td class="button__cell"><a href="{{ return_label.public_file_url }}" class="button__text">הדפס תווית החזרה</a></td>
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
                <h3>הוראות</h3>
              </td>
            </tr>
          </table>
          <table class="container">
            <tr>
              <td>
                
              <ol>
                <li class="return-label__instruction-step">ארוז את הפריטים שאתה מחזיר.</li>
                <li class="return-label__instruction-step">הדפס את תווית ההחזרה והדבק אותה על החבילה. כסה תוויות משלוח קיימות.</li>
                <li class="return-label__instruction-step">מסור את החבילה לחברת המשלוחים המצוינת על התווית.</li>
              </ol>
  
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
  `},
  
];
