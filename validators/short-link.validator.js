import Joi from "joi";

const linkSchema = Joi.object({
  shortCode: Joi.string()
    .alphanum() // Letters and numbers only
    .min(4) // Minimum length (adjust as needed)
    .max(10) // Maximum length (adjust as needed)
    .optional()
    .messages({
      "string.base": "Shortcode must be a string",
      "string.alphanum": "Shortcode can only contain letters and numbers",
      "string.min": "Shortcode must be at 4 least  characters long",
      "string.max": "Shortcode must be at 10 most  characters long",
    }),
  originalUrl: Joi.string()
    .pattern(
      /^https?:\/\/(?:[a-zA-Z0-9-]+\.)+(?:[a-zA-Z]{2,})(?::\d+)?(?:\/[^\s]*)?$/
    )
    .required()
    .messages({
      "string.base": "L'URL doit être une chaîne de caractères",
      "string.pattern": "L'URL fournie n'est pas valide",
      "any.required": "L'URL est requise",
    }),
  expiresAtString: Joi.string()
    .pattern(
      /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}( ([01][0-9]|2[0-3]):[0-5][0-9])?$/
    )
    .messages({
      "string.pattern.base":
        'Invalid format. Use "DD/MM/YYYY" or "DD/MM/YYYY HH:MM"',
    })
    .optional(),
});

export function createShortLinkValidator(req, res, next) {
  const { error } = linkSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
}

const IdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const readIdValidator = (req, res, next) => {
  const { error } = IdSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
