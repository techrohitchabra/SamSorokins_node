import checkout from "./post";

export default async (req, res, next) => {
  req.body.userType = req.body.userType || "Vendor Request";
  return checkout(req, res, next);
};
