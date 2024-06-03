import exactMath from "exact-math/dist/exact-math.node.js";
import _ from "lodash";
import moment from "moment";
import { ObjectId } from "mongodb";
import { isBlankString } from "./validate.js";
// import { isBlankString } from "utils/validate";

const convertObject = (object, key, convertId = false) => {
  if (!object[key]) return null;

  if (object[key].constructor == String) {
    if (convertId || key.match(/^[A-z]+Id$/))
      object[key] = ObjectId(object[key]);
    if (convertId || key === "_id") object[key] = ObjectId(object[key]);
  } else if (object[key].constructor == Array) {
    if (convertId || key.match(/^[A-z]+Id$/))
      object[key] = object[key].map(
        (value) => (!!value && ObjectId(value)) || null
      );
    if (convertId || key === "_id")
      object[key] = object[key].map(
        (value) => (!!value && ObjectId(value)) || null
      );
  } else if (object[key].constructor == Object) {
    if (convertId || key.match(/^[A-z]+Id$/))
      object[key] = convertObjectKey(object[key], true);
    if (convertId || key === "_id")
      object[key] = convertObjectKey(object[key], true);
  }

  return object;
};

const convertObjectKey = (object, convertId = false) => {
  Object.keys(object).map((key) => {
    convertObject(object, key, convertId);
  });
  return object;
};

export const convertObjectId = (object) => {
  return convertObjectKey(object);
};

export function sanitizeRegex(str) {
  if (!str) {
    return "";
  }

  const trimmedStr = str.trim();
  const sanitizedStr = trimmedStr.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&");

  return sanitizedStr;
}

export const formatSlug = (title) => {
  const dashify = (title || "").toLowerCase().replace(/[^a-zA-Z\d:]/g, "-");
  const simplify = dashify.replace(/(-)\1+/g, "-");

  return simplify;
};
export const getTime = (currentTime) => {
  try {
    return new Date(currentTime).getTime();
  } catch (err) {
    return currentTime;
  }
};

export function getTimeDuration(currentTime, timeCode) {
  try {
    const currentTimeObj = moment(currentTime);
    let result = null;
    if (timeCode[0] === "C") {
      switch (timeCode[1]) {
        case "M":
          result = currentTimeObj.endOf("month");
          break;
        case "Y":
          result = currentTimeObj.endOf("year");
          break;
        case "W":
          result = currentTimeObj.endOf("week");
          break;
        default:
          result = currentTimeObj;
          break;
      }
    } else {
      const durationTime = timeCode.replace(/[^0-9]/gi, "");
      let duration =
        !!durationTime && durationTime.trim().length > 0
          ? parseFloat(durationTime)
          : 0;
      const unitTime = timeCode.replace(/[^a-z]/gi, "");
      switch (unitTime) {
        case "D":
          result = currentTimeObj.add(duration, "day");
          break;
        case "M":
          result = currentTimeObj.add(duration, "month");
          break;
        case "Y":
          result = currentTimeObj.add(duration, "year");
          break;
        case "W":
          result = currentTimeObj.add(duration, "week");
          break;
        default:
          // include 0D
          result = currentTimeObj;
          break;
      }
    }

    return result.valueOf();
  } catch (err) {
    console.log("Error: ", err);
    return null;
  }
}

export function splitNumber({ text }) {
  if (!text) {
    return null;
  }

  const match = text.match(/[+-]?\d+(?:\.\d+)?|\B-\B/) || {};
  const str = match[0];
  const index = match["index"];

  if (!str) {
    return text;
  }

  return [
    splitNumber({ text: text.slice(0, index) }),
    str,
    splitNumber({ text: text.slice(index + str.length, text.length) }),
  ]
    .flat()
    .filter((x) => !!x && x.trim().length > 0);
}

export function findDigits({ text }) {
  const digitStrings = (text || "").match(/[+-]?\d+(?:\.\d+)?|\B-\B/g) || [];
  return digitStrings.map((digitString) => parseFloat(digitString));
}

export function parseDateFromArgs(args, keys) {
  let newArgs = { ...args };
  keys.forEach((key) => {
    if (!!args[key] && args[key] !== null) {
      newArgs[key] = moment(args[key]).valueOf();
    }
  });
  return newArgs;
}

export function toMoney(pricing) {
  return `${numberWithCommas(round(Number(pricing) || 0, 2).toFixed(2))}`;
}

export function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function resolvePercent(percent) {
  if (!percent) return 0;
  if (percent < 0) return 0;
  if (percent > 100) return 0;
  return percent;
}

export function round(value, precision = 1) {
  return exactMath.round(value, -1 * (precision || 0));
}

export function convertDateInputToDate(date, hour) {
  const [h, m] = hour.split(":").map((e) => Number(e));
  const d = moment.utc(date).add(8, "h").startOf("date");
  return d.hour(h).minute(m);
}

export function formatPrinterRecorderInfo(info) {
  const convertedInfo = convertObjectId(info);
  if ("id" in convertedInfo && !isBlankString(convertedInfo.id)) {
    convertedInfo.id = ObjectId(convertedInfo.id);
  }
  return convertedInfo;
}

export function parseFloatAndRound(value, precision) {
  return round(Number(value || 0), precision);
}

export function processFormula(formula) {
  const result = exactMath.formula(formula);
  return result;
}

export function processFormulaAndRound(formula, precision = 2) {
  const result = exactMath.formula(formula);
  return round(result, precision);
}

export function convertSGTtime(value) {
  if (!value) {
    return null;
  }
  return moment.utc(value).add(8, "h");
}

//generate all cases arrangement in sentence
export function permute(permutation, limit = -1) {
  var length = permutation.length,
    result = [permutation.slice()],
    c = new Array(length).fill(0),
    i = 1,
    k,
    p;

  while (i < length) {
    if (c[i] < i) {
      k = i % 2 && c[i];
      p = permutation[i];
      permutation[i] = permutation[k];
      permutation[k] = p;
      ++c[i];
      i = 1;
      result.push(permutation.slice());
      if (limit > 0 && limit > result.length) {
        return result;
      }
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return result;
}

export function formatSlashToAsterisk(value) {
  try {
    return _.replace(value, "/", "*");
  } catch (err) {
    return value;
  }
}

export async function executeByBatch(
  {
    collectionName,
    filters,
    batchSize = 200,
    orderBy = { createdAt: -1 },
    readOnly = false,
  },
  context,
  callback
) {
  let pageSize = 0;
  const { mongo } = context;
  let prevCountDocs = 0;
  while (true) {
    const records = await mongo[collectionName]
      .find(filters)
      .sort(orderBy)
      .limit(batchSize)
      .skip(readOnly ? pageSize * batchSize : 0)
      .toArray();
    const totalBatchDocs = records.length;
    if (totalBatchDocs === 0) {
      break;
    }
    let recordIndex = 0;

    while (recordIndex < totalBatchDocs) {
      const record = records[recordIndex];
      await callback(record, prevCountDocs + recordIndex);
      recordIndex++;
    }
    prevCountDocs = prevCountDocs + totalBatchDocs;
    pageSize++;
  }
}
