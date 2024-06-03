import Joi from "joi";
// Định nghĩa schema cho người dùng
const userSchema = Joi.object({
  username: Joi.string().required(),
  fullName: Joi.string().required(),
  password: Joi.string().required(),
  gender: Joi.string().valid("male", "female", "other").required(), // Giả sử 'gender' có thể là 'male', 'female' hoặc 'other'
  profilePicture: Joi.string().allow("").optional(), // Cho phép trống và là tuỳ chọn
});

// Hàm kiểm tra dữ liệu người dùng
function validateUser(user) {
  return userSchema.validate(user);
}
export default validateUser;
