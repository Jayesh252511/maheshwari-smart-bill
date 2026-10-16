# Architecture rules
- Save bills and replace their items through the owner-scoped, security-invoker `save_bill_with_items` transaction so failures cannot leave partially saved bills.
- Use the shared BillDetails window on Home and History so both views open the same receipt and editing flow.
- Reload editing data per bill and keep draft items independent of list state so switching or cancelling edits never mutates another bill.