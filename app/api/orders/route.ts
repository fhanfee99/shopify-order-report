import { NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';

export async function GET() {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN || 'farhandev3.myshopify.com';

  try {
    const query = `
      query getOrders {
        orders(first: 100, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet { shopMoney { amount currencyCode } }
              subtotalPriceSet { shopMoney { amount } }
              totalTaxSet { shopMoney { amount } }
              totalShippingPriceSet { shopMoney { amount } }
              totalDiscountsSet { shopMoney { amount } }
              tags
              note
              customer {
                displayName
                email
                phone
                numberOfOrders
                tags
              }
              shippingAddress {
                city
                province
                country
                zip
              }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    sku
                    originalUnitPriceSet { shopMoney { amount currencyCode } }
                    discountedUnitPriceSet { shopMoney { amount currencyCode } }
                    customAttributes {
                      key
                      value
                    }
                    variant {
                      sku
                      price
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response: any = await shopifyFetch({ query });
    const rawOrders = response?.orders?.edges?.map((e: any) => e.node) || [];

    const flattenedRows = rawOrders.map((order: any) => {
          const lineItems = order.lineItems?.edges?.map((e: any) => e.node) || [];

          // --- CLEAN FORMATTING (NO ICONS, SEPARATED BY NEWLINE) ---
          const formattedLineItems = lineItems.map((li: any) => {
            const unitPrice = li.discountedUnitPriceSet?.shopMoney?.amount || li.originalUnitPriceSet?.shopMoney?.amount || '0';
            let itemStr = `${li.title} (Qty: ${li.quantity}) - ₹${unitPrice}`;

            // Agar properties/attributes hain toh unhe simple text me neeche dikhayein bina icons ke
            if (li.customAttributes && li.customAttributes.length > 0) {
              const subAttributes = li.customAttributes
                .map((attr: any) => `${attr.key}: ${attr.value}`)
                .join('\n');
              itemStr += `\n${subAttributes}`;
            }
            return itemStr;
          });

          const productTitles = formattedLineItems.join('\n');

      const skus = lineItems
        .map((li: any) => li.sku || li.variant?.sku || '')
        .filter(Boolean)
        .join(', ');
      const totalQty = lineItems.reduce((acc: number, li: any) => acc + (li.quantity || 0), 0);

      // --- BUNDLE EXTRACTION LOGIC ---
      const bundleItems = lineItems.filter((li: any) => {
        const isTitleBundle = li.title.toLowerCase().includes('bundle');
        const hasBundleAttr = li.customAttributes?.some(
          (attr: any) => attr.key.toLowerCase().includes('bundle') || attr.value.toLowerCase().includes('bundle')
        );
        return isTitleBundle || hasBundleAttr;
      });

      const isBundleOrder = bundleItems.length > 0;
      const bundleNames = bundleItems.map((b: any) => b.title).join(', ') || 'N/A';

      // Calculate total bundle price & bundle quantity
      const bundleTotalQty = bundleItems.reduce((acc: number, b: any) => acc + (b.quantity || 0), 0);
      const bundleTotalPrice = bundleItems
        .reduce((acc: number, b: any) => {
          const unitPrice = parseFloat(b.discountedUnitPriceSet?.shopMoney?.amount || b.originalUnitPriceSet?.shopMoney?.amount || '0');
          return acc + unitPrice * (b.quantity || 1);
        }, 0)
        .toFixed(2);

      return {
        orderName: order.name || 'N/A',
        createdAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
        customerName: order.customer?.displayName || 'Guest',
        customerEmail: order.customer?.email || 'N/A',
        customerPhone: order.customer?.phone || 'N/A',
        customerTags: (order.customer?.tags || []).join(', ') || 'None',
        customerOrdersCount: order.customer?.numberOfOrders || 0,
        products: productTitles || 'No Items',
        skus: skus || 'N/A',
        quantity: totalQty,

        // --- NEW BUNDLE FIELDS FOR DYNAMIC FILTERS ---
        isBundle: isBundleOrder ? 'Yes' : 'No',
        bundleName: bundleNames,
        bundlePrice: bundleTotalPrice,
        bundleQty: bundleTotalQty,

        subtotalAmount: order.subtotalPriceSet?.shopMoney?.amount || '0.00',
        totalDiscount: order.totalDiscountsSet?.shopMoney?.amount || '0.00',
        totalTax: order.totalTaxSet?.shopMoney?.amount || '0.00',
        totalShipping: order.totalShippingPriceSet?.shopMoney?.amount || '0.00',
        totalAmount: order.totalPriceSet?.shopMoney?.amount || '0.00',
        currency: order.totalPriceSet?.shopMoney?.currencyCode || 'INR',
        financialStatus: order.displayFinancialStatus || 'N/A',
        fulfillmentStatus: order.displayFulfillmentStatus || 'N/A',
        orderTags: (order.tags || []).join(', ') || 'None',
        note: order.note || 'None',
        shippingCity: order.shippingAddress?.city || 'N/A',
        shippingState: order.shippingAddress?.province || 'N/A',
        shippingCountry: order.shippingAddress?.country || 'N/A',
        shippingZip: order.shippingAddress?.zip || 'N/A',
      };
    });

    return NextResponse.json({
      success: true,
      connected: true,
      data: flattenedRows,
      count: flattenedRows.length,
      storeDomain,
    });
  } catch (error: any) {
    console.error('Shopify API Connect Error:', error.message);
    return NextResponse.json({
      success: false,
      connected: false,
      data: [],
      error: error.message || 'Failed to connect with Shopify API',
      storeDomain,
    });
  }
}
