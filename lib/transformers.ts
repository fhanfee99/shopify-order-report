export interface ReportRow {
  orderId: string;
  orderName: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerTags: string;
  productTitle: string;
  variantSku: string;
  quantity: number;
  price: string;
  totalAmount: string;
  financialStatus: string;
  fulfillmentStatus: string;
}

export function flattenShopifyOrders(ordersData: any[]): ReportRow[] {
  const rows: ReportRow[] = [];

  ordersData.forEach((orderNode) => {
    const order = orderNode.node || orderNode;
    const customer = order.customer || {};

    if (order.lineItems?.edges?.length > 0) {
      order.lineItems.edges.forEach((itemEdge: any) => {
        const item = itemEdge.node;
        rows.push({
          orderId: order.id,
          orderName: order.name,
          createdAt: new Date(order.createdAt).toLocaleDateString('en-IN'),
          customerName: customer.displayName || 'Guest',
          customerEmail: customer.email || 'N/A',
          customerTags: customer.tags ? customer.tags.join(', ') : '',
          productTitle: item.title,
          variantSku: item.variant?.sku || 'N/A',
          quantity: item.quantity,
          price: item.variant?.price || '0.00',
          totalAmount: order.totalPriceSet?.shopMoney?.amount || '0.00',
          financialStatus: order.displayFinancialStatus || 'N/A',
          fulfillmentStatus: order.displayFulfillmentStatus || 'N/A',
        });
      });
    } else {
      rows.push({
        orderId: order.id,
        orderName: order.name,
        createdAt: new Date(order.createdAt).toLocaleDateString('en-IN'),
        customerName: customer.displayName || 'Guest',
        customerEmail: customer.email || 'N/A',
        customerTags: customer.tags ? customer.tags.join(', ') : '',
        productTitle: 'N/A',
        variantSku: 'N/A',
        quantity: 0,
        price: '0.00',
        totalAmount: order.totalPriceSet?.shopMoney?.amount || '0.00',
        financialStatus: order.displayFinancialStatus || 'N/A',
        fulfillmentStatus: order.displayFulfillmentStatus || 'N/A',
      });
    }
  });

  return rows;
}
