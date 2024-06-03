import _ from "lodash";

export function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function isBlankString(stringValue) {
  return !stringValue || stringValue.toString().trim().length === 0;
}

export function isEmptyObject(obj) {
  if (
    obj === undefined ||
    obj === null ||
    typeof obj !== "object" ||
    Array.isArray(obj)
  ) {
    return true;
  }
  for (var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

export function hasSameValueInsideObject(obj, value = false) {
  if (isEmptyObject(obj)) {
    return true;
  }
  const checkerResult = [...new Set(Object.values(obj))];
  return checkerResult.length === 1 && checkerResult[0] === value;
}

export function checkCorrectlyInputType(value, dataTypeInput) {
  try {
    switch (dataTypeInput) {
      case "positive_integer":
        return /^\d*$/.test(value);
      case "integer":
        return /^-?\d*$/.test(value);
      case "decimal":
        return /^-?\d*[.]?\d*$/.test(value);
      case "positive_decimal":
        return (
          /^-?\d*[.]?\d*$/.test(value) &&
          (value === "" || parseFloat(value) >= 0)
        );
      case "money":
        return (
          /^-?\d*[.]?\d{0,2}$/.test(value) &&
          (value === "" || parseFloat(value) >= 0)
        );
      case "a-z":
        return /^[a-z]*$/i.test(value);
      case "shippingTime":
        return /^[0-9a-zA-Z-+]+$/.test(value);
      case "containedNumber":
        return /\w*\d{1,}\w*/.test(value);
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function validateUOMs(itemUOMs) {
  if (!_.isArray(itemUOMs) || itemUOMs.length === 0) {
    return { valid: false, message: "UOMs is not valid" };
  }

  const validUOM = itemUOMs.reduce(
    (prev, itemUOM, index) => {
      const { code, qtyPerUOM } = itemUOM;

      if (code.length > 10) {
        return { valid: false, message: "UOM code length must <= 10" };
      }

      if (typeof qtyPerUOM !== "number") {
        return { valid: false, message: "Qty must be number" };
      }

      if (["-", null].includes(code)) {
        if (qtyPerUOM >= 0) {
          return { valid: true };
        }
        return { valid: false, message: "Qty must >= 0" };
      } else {
        if (_.findLastIndex(itemUOMs, { code }) !== index) {
          return { valid: false, message: "Code must be unique" };
        }
        if (qtyPerUOM > 0) {
          return { valid: true };
        }
        return { valid: false, message: "Qty must > 0" };
      }
    },
    { valid: true }
  );

  return validUOM;
}
