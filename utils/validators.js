export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const currencySymbolMax = 5;

export function validateSignup(values) {
  const errors = {};
  if (!values.firstName || !values.firstName.trim()) errors.firstName = 'Please enter your first name.';
  if (!values.lastName || !values.lastName.trim()) errors.lastName = 'Please enter your last name.';
  if (!values.email || !emailRegex.test(values.email)) errors.email = 'Enter a valid email address.';
  if (!values.password || values.password.length < 8) errors.password = 'Password must be at least 8 characters long.';
  if (!values.companyName || !values.companyName.trim()) errors.companyName = 'Please enter your company name.';
  if (!values.address || !values.address.trim()) errors.address = 'Please enter company address.';
  if (!values.city || !values.city.trim()) errors.city = 'Please enter city.';
  if (values.zip) {
    if (!/^\d{6}$/.test(values.zip)) errors.zip = 'Zip must be exactly 6 digits.';
  }
  if (!values.currencySymbol || values.currencySymbol.length > currencySymbolMax) errors.currencySymbol = 'Enter a valid currency symbol.';
  return errors;
}

export function validateLogin(values) {
  const errors = {};
  if (!values.email || !emailRegex.test(values.email)) errors.email = 'Enter a valid email address.';
  if (!values.password || values.password.length < 8) errors.password = 'Enter your password.';
  return errors;
}

export function validateItem(values) {
  const errors = {};
  if (!values.itemName || !values.itemName.trim()) errors.itemName = 'Please enter item name.';
  if (values.itemName && values.itemName.length > 50) errors.itemName = 'Name must be 50 chars or less.';
  if (values.saleRate == null || isNaN(values.saleRate) || Number(values.saleRate) < 0) errors.saleRate = 'Enter a valid rate.';
  if (values.discountPct != null) {
    if (Number(values.discountPct) < 0 || Number(values.discountPct) > 100) errors.discountPct = 'Discount must be 0–100.';
  }
  return errors;
}

/* Invoice validation: top-level and line item validation is implemented in InvoiceEditor component */
