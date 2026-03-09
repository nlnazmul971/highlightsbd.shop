

## বর্তমান অবস্থা

আপনার ওয়েবসাইটে এখন **কোনো ecommerce dataLayer event push হচ্ছে না** — না ViewContent (FB), না view_item (GA4)। শুধু GTM script load হচ্ছে, কিন্তু product page এ গেলে কোনো event fire হচ্ছে না।

ছবিতে যা দেখাচ্ছে সেটা GTM এর Variable/Tag setup — কিন্তু সেই data পাঠানোর জন্য আপনার website থেকে `dataLayer.push()` করতে হবে।

## যা করতে হবে

**ProductDetail page এ dataLayer push যোগ করা** — product load হলে নিচের format এ event push হবে:

```javascript
// GA4 view_item + FB ViewContent (GTM handles both via dataLayer)
window.dataLayer.push({
  event: 'view_item',
  ecommerce: {
    currency: 'BDT',
    value: product.price,
    detail: {
      products: [{
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price
      }]
    },
    items: [{
      item_id: product.id,
      item_name: product.name,
      category: product.category,
      price: product.price
    }]
  }
});
```

### পরিবর্তন

1. **`src/pages/ProductDetail.tsx`** — product data load হওয়ার পর `useEffect` এ `dataLayer.push()` কল করা, উপরের format অনুযায়ী। এতে GTM থেকে FB ViewContent ও GA4 view_item দুটোই trigger করা যাবে।

2. **Window type declaration** — `window.dataLayer` এর TypeScript type declare করা।

এই একটি পরিবর্তনেই ছবিতে দেখানো দুটো event (FB ViewContent + GA4 view_item) কাজ করবে, কারণ GTM এর tag setup অনুযায়ী dataLayer থেকে data নেবে।

