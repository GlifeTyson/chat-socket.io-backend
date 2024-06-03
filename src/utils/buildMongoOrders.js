export const orderByField = (orderBy) => {
  // orderBy = firstName_DESC
  // output = { firstName: -1 }
  let h = {};
  if (orderBy.includes("_ASC")) {
    h = { [orderBy.replace("_ASC", "")]: "asc" };
  } else if (orderBy.includes("_DESC")) {
    h = { [orderBy.replace("_DESC", "")]: "desc" };
  }
  // console.log('Order by: ', JSON.stringify(h, null, 2))
  return h;
};

export default (orderBy) => {
  if (Array.isArray(orderBy)) {
    return orderBy.reduce(
      (prev, orderField) => ({ ...prev, ...orderByField(orderField) }),
      {}
    );
  } else {
    return orderByField(orderBy);
  }
};
