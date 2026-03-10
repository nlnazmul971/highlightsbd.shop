
সমস্যাটা কোডে একদম “মেইল যাচ্ছে না” টাইপ মনে হচ্ছে না। আমি যা দেখলাম:

1. `send-order-email` ফাংশনে `FROM_EMAIL = HIGHLIGHTS <noreply@highlightsbd.shop>` ব্যবহার হচ্ছে।
2. `RESEND_API_KEY` আর `ADMIN_NOTIFICATION_EMAIL` secret আছে।
3. checkout থেকে `send-order-email` invoke হচ্ছে।
4. তোমার স্ক্রিনশটে DKIM/SPF/MX verified এবং sending enabled দেখা যাচ্ছে।

তাই মূল সমস্যা সবচেয়ে বেশি সম্ভবত deliverability/inbox placement — মানে mail পাঠানো হচ্ছে, কিন্তু inbox trust কম থাকায় spam এ পড়ছে।

```text
Current likely state
Order placed
→ backend email sent
→ recipient server accepts it
→ mailbox provider marks as low-trust / promotional / spam
```

আমি এইভাবে fix করার plan নিতাম:

### What I’d change
1. `DMARC` add/check
   - এখন screenshot-এ DKIM/SPF আছে, কিন্তু DMARC দেখা যাচ্ছে না।
   - DMARC না থাকলে Gmail/Outlook inbox placement খারাপ হতে পারে।

2. Sender identity improve
   - `noreply@highlightsbd.shop` এর বদলে `orders@highlightsbd.shop` বা `support@highlightsbd.shop` use করা ভালো।
   - `noreply` sender অনেক সময় trust কমায়।

3. Email payload improve
   - HTML-only না রেখে plain text fallback যোগ করব।
   - `reply_to` add করব।
   - admin subject থেকে emoji বাদ দেব।
   - subject line একটু cleaner করব, যেমন:
     - Customer: `Your HIGHLIGHTS order #ABC12345`
     - Admin: `New order received #ABC12345`

4. Template content less spammy করব
   - খুব decorative / all-caps / flashy phrasing কমাব।
   - top section আরও transactional and neutral tone এ আনব।
   - unnecessary symbols/emoji কমাব।

5. Delivery debugging add করব
   - edge function-এ response logging আরও clear করব যাতে বোঝা যায় provider accepted করেছে নাকি reject করেছে।
   - প্রয়োজনে `message id` log রেখে পরে trace করা যাবে।

### Most likely non-code fix
তোমার screenshot দেখে strongest suspicion:
- DKIM/SPF ঠিক আছে
- কিন্তু DMARC missing
- sender reputation নতুন
- `noreply` + HTML-only mail + stylized subject spam score বাড়াচ্ছে

### Implementation plan
- Step 1: existing transactional email setup keep রেখে sender/email subjects harden করা
- Step 2: email function-এ plain text + reply-to + cleaner headers add করা
- Step 3: two email templates-কে more transactional tone এ simplify করা
- Step 4: তোমাকে exact DMARC record দেব যেটা DNS-এ add করতে হবে
- Step 5: তারপর test order দিয়ে inbox vs spam compare করা

### Technical details
- File to update:
  - `supabase/functions/send-order-email/index.ts`
  - `supabase/functions/_shared/email-templates/order-confirmation.tsx`
  - `supabase/functions/_shared/email-templates/admin-order-notification.tsx`
- Key backend changes:
  - `from` address improvement
  - `text` body addition
  - `reply_to` addition
  - safer subject formatting
- Key DNS change outside code:
  - add DMARC TXT record for `_dmarc.highlightsbd.shop`

### Recommended DMARC record
শুরুর জন্য safe setup:
```text
Host/Name: _dmarc
Type: TXT
Value: v=DMARC1; p=none; adkim=s; aspf=s; rua=mailto:postmaster@highlightsbd.shop
```

পরে inbox improve হলে stricter policy এ যাওয়া যাবে:
```text
v=DMARC1; p=quarantine; adkim=s; aspf=s; rua=mailto:postmaster@highlightsbd.shop
```

### Expected result
এগুলো করার পর:
- spam rate কমবে
- Gmail/Outlook trust improve হবে
- customer + admin notification দুইটাই inbox এ যাওয়ার chance বাড়বে

সবচেয়ে important point: screenshot অনুযায়ী “verification হয়নি” problem না — এখন focus হওয়া উচিত deliverability hardening + DMARC + sender quality।
