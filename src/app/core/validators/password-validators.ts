import { Validators } from '@angular/forms';

export const passwordValidators = [
  Validators.required,
  Validators.minLength(8),
  Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/)
];

export function passwordCriteria(pwd: string) {
  const value = pwd ?? '';
  return {
    hasUpper: /[A-Z]/.test(value),
    hasLower: /[a-z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSymbol: /[^\w\s]/.test(value),
    minLen: value.length >= 8
  };
}
