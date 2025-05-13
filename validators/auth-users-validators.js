import Joi from "joi";
import createError from "http-errors";

const userRegisterValidator = Joi.object({
  firstName: Joi.string().min(3).max(30).required(),
  lastName: Joi.string().min(3).max(30).required(),
  email: Joi.string()
    .email({
      minDomainSegments: 2,
    })
    .required(),
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])"))
    .message(
      "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
    )
    .required(),
  repeat_password: Joi.ref("password"),
  adresse: Joi.string().min(3).max(30),
  phone: Joi.string().min(9).max(30),
});

export const registerUsertValidate = (req, res, next) => {
  const { error } = userRegisterValidator.validate(req.body);
  if (error) {
    return next(createError(400, error.details[0].message));
  }
  next();
};

const loginSchema = Joi.object({
  email: Joi.string().email({ maxDomainSegments: 2 }).required(),
  password: Joi.string().required(),
});

export const loginUserValidator = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return next(createError(400, error.details[0].message));
  }
  next();
};
