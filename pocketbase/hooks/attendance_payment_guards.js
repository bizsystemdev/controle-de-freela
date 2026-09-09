onRecordCreateRequest((e) => {
  e.record.set('payment_required', false)
  e.record.set('payment_confirmed', false)
  e.record.set('received_amount_cents', 0)
  e.record.set('payment_confirmed_at', '')
  e.record.set('payment_confirmed_by', '')
  e.record.set('payment_confirmed_by_name', '')
  e.next()
}, 'attendance_records')
