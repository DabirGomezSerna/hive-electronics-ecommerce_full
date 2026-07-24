/**
 * This file has no runtime behavior. It exists solely to host the reusable
 * OpenAPI `components.schemas` and `components.responses` definitions as
 * `@openapi` JSDoc comments, scanned by swagger-jsdoc (see src/config/swagger.js).
 * Route files reference these via $ref instead of repeating full shapes.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: >
 *         The password field is excluded from this schema because every
 *         endpoint that returns a User document, except GET /users/search,
 *         calls .select("-password"). GET /users/search does not exclude it,
 *         so its "users" array items include the raw password hash.
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *         displayName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [customer, admin]
 *         avatar:
 *           type: string
 *           format: uri
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserCreateInput:
 *       type: object
 *       required: [displayName, email, password, role, avatar]
 *       properties:
 *         displayName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         role:
 *           type: string
 *           enum: [customer, admin]
 *         avatar:
 *           type: string
 *           format: uri
 *     UserUpdateInput:
 *       type: object
 *       description: >
 *         Only displayName, email, and role are read and persisted by
 *         PUT /users/:id, even though the User model has additional fields.
 *       properties:
 *         displayName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [customer, admin]
 *     RegisterInput:
 *       type: object
 *       required: [displayName, email, password]
 *       description: >
 *         POST /register has no express-validator chain, so these fields are
 *         not format-validated at the route layer.
 *       properties:
 *         displayName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         avatar:
 *           type: string
 *           format: uri
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         displayName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [customer]
 *           description: Always "customer" — role cannot be set via this endpoint.
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT access token (JWT_EXPIRES_IN, default 1h).
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token (JWT_REFRESH_EXPIRES_IN, default 7d).
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       description: >
 *         category is populated on every endpoint (with its own
 *         parentCategory further populated) except GET /products/search,
 *         where only category itself is populated.
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           minimum: 0
 *         stock:
 *           type: integer
 *           minimum: 0
 *         image:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: >
 *             Schema type is Array, but the model's default value is a
 *             single placeholder URL string, not an array.
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProductCreateInput:
 *       type: object
 *       required: [name, price, stock, category]
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           minimum: 1
 *         stock:
 *           type: integer
 *           minimum: 1
 *         image:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         category:
 *           type: string
 *           description: MongoDB ObjectId of an existing Category
 *     ProductUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         price:
 *           type: number
 *           minimum: 0
 *         stock:
 *           type: integer
 *           minimum: 1
 *         image:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         category:
 *           type: string
 *           description: MongoDB ObjectId of an existing Category
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *           format: uri
 *         parentCategory:
 *           $ref: '#/components/schemas/Category'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CategoryCreateInput:
 *       type: object
 *       required: [name, description]
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         imageURL:
 *           type: string
 *           format: uri
 *           description: >
 *             Note the casing: this request field is named imageURL,
 *             matching the express-validator chain and the controller's
 *             destructuring — but the persisted/response field is imageUrl.
 *             Because of this mismatch, Mongoose silently drops the value
 *             and the document keeps the schema default for imageUrl.
 *         parentCategory:
 *           type: string
 *           description: MongoDB ObjectId of an existing Category
 *     CategoryUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         imageURL:
 *           type: string
 *           format: uri
 *           description: >
 *             Same imageURL/imageUrl casing mismatch as CategoryCreateInput —
 *             this value is accepted by the validator but not persisted.
 *         parentCategory:
 *           type: string
 *           description: MongoDB ObjectId of an existing Category
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       description: >
 *         Every cart-returning endpoint populates both "user" and
 *         "products.product".
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 $ref: '#/components/schemas/Product'
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CartCreateInput:
 *       type: object
 *       required: [user]
 *       properties:
 *         user:
 *           type: string
 *           description: MongoDB ObjectId of an existing User
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     CartPutInput:
 *       type: object
 *       required: [user, products]
 *       properties:
 *         user:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             required: [product, quantity]
 *             properties:
 *               product:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     CartModifyInput:
 *       type: object
 *       required: [userId, productId]
 *       properties:
 *         userId:
 *           type: string
 *           description: MongoDB ObjectId of an existing User
 *         productId:
 *           type: string
 *           description: MongoDB ObjectId of an existing Product
 *         quantity:
 *           type: integer
 *           default: 1
 *           description: >
 *             Read directly by the controller with a default of 1; not
 *             validated by express-validator.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       description: >
 *         address and paymentMethod are populated on GET /orders,
 *         GET /orders/:id, and GET /orders/user/:id, but NOT on the
 *         POST /orders response (only user and products.product are
 *         populated there). PUT /orders/:id's response is not populated
 *         at all.
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 $ref: '#/components/schemas/Product'
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               price:
 *                 type: number
 *                 minimum: 0
 *         address:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         paymentMethod:
 *           $ref: '#/components/schemas/PaymentMethod'
 *         shippingCost:
 *           type: number
 *           minimum: 0
 *         taxAmount:
 *           type: number
 *           minimum: 0
 *           description: >
 *             Computed server-side in createOrder as 16% of the product
 *             subtotal (sum of products[].price * products[].quantity).
 *             Clients cannot set this value directly.
 *         totalPrice:
 *           type: number
 *           description: >
 *             Computed server-side in createOrder as
 *             subtotal + taxAmount + shippingCost.
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     OrderCreateInput:
 *       type: object
 *       required: [user, products, address, paymentMethod]
 *       description: >
 *         taxAmount and totalPrice are not accepted in the request body —
 *         they are always computed server-side.
 *       properties:
 *         user:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             required: [product, quantity, price]
 *             properties:
 *               product:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: >
 *                   Client-supplied per line item. Only format-validated
 *                   (a non-negative number); not cross-checked against the
 *                   current Product price in the database.
 *         address:
 *           type: string
 *         paymentMethod:
 *           type: string
 *         shippingCost:
 *           type: number
 *           minimum: 0
 *           description: >
 *             Optional; client-supplied and stored as-is with no
 *             server-side recomputation or verification.
 *     OrderUpdateInput:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     PaymentMethod:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         type:
 *           type: string
 *           enum: [credit_card, debit_card, paypal, bank_transfer, cash_on_delivery]
 *         cardNumber:
 *           type: string
 *         cardHolderName:
 *           type: string
 *         expiryDate:
 *           type: string
 *         paypalEmail:
 *           type: string
 *         bankName:
 *           type: string
 *         accountNumber:
 *           type: string
 *         isDefault:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         cvv:
 *           type: string
 *           description: >
 *             Excluded via .select("-cvv") on GET /payment-methods/:id and
 *             GET /payment-methods/user/:id only. Included in the
 *             GET /payment-methods (list) response and in create/update
 *             responses.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PaymentMethodCreateInput:
 *       type: object
 *       required: [user, type]
 *       description: >
 *         Only "user" and "type" are format-validated at the route layer;
 *         the remaining fields are read directly by the controller with no
 *         express-validator checks.
 *       properties:
 *         user:
 *           type: string
 *         type:
 *           type: string
 *           enum: [credit_card, debit_card, paypal, bank_transfer, cash_on_delivery]
 *         isDefault:
 *           type: boolean
 *           description: >
 *             If true, all of this user's other payment methods have
 *             isDefault set to false first.
 *         cardNumber:
 *           type: string
 *         cardHolderName:
 *           type: string
 *         expiryDate:
 *           type: string
 *         paypalEmail:
 *           type: string
 *         bankName:
 *           type: string
 *         accountNumber:
 *           type: string
 *         isActive:
 *           type: boolean
 *           description: >
 *             Read from the request body, but the controller's fallback
 *             logic (isActive || true) means this field cannot actually be
 *             set to false via this endpoint.
 *         cvv:
 *           type: string
 *     PaymentMethodUpdateInput:
 *       type: object
 *       description: >
 *         Only "type", "isDefault", and "cardNumber" are format-validated at
 *         the route layer; the remaining fields are read directly by the
 *         controller.
 *       properties:
 *         type:
 *           type: string
 *           enum: [credit_card, debit_card, paypal, bank_transfer, cash_on_delivery]
 *         isDefault:
 *           type: boolean
 *         cardNumber:
 *           type: string
 *           maxLength: 16
 *         cardHolderName:
 *           type: string
 *         expiryDate:
 *           type: string
 *         paypalEmail:
 *           type: string
 *         bankName:
 *           type: string
 *         accountNumber:
 *           type: string
 *         isActive:
 *           type: boolean
 *         cvv:
 *           type: string
 *     ShippingAddress:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         name:
 *           type: string
 *         address1:
 *           type: string
 *         address2:
 *           type: string
 *         postalCode:
 *           type: string
 *         city:
 *           type: string
 *         country:
 *           type: string
 *         reference:
 *           type: string
 *         defaultAddress:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ShippingAddressCreateInput:
 *       type: object
 *       required: [user, address1, postalCode, city, country]
 *       properties:
 *         user:
 *           type: string
 *         name:
 *           type: string
 *         address1:
 *           type: string
 *         address2:
 *           type: string
 *         postalCode:
 *           type: string
 *         city:
 *           type: string
 *         country:
 *           type: string
 *         reference:
 *           type: string
 *         defaultAddress:
 *           type: boolean
 *     ShippingAddressUpdateInput:
 *       type: object
 *       description: >
 *         "user" is not accepted/persisted by PUT /addresses/:id even if
 *         sent, so it is intentionally omitted from this schema.
 *       properties:
 *         name:
 *           type: string
 *         address1:
 *           type: string
 *         address2:
 *           type: string
 *         postalCode:
 *           type: string
 *         city:
 *           type: string
 *         country:
 *           type: string
 *         reference:
 *           type: string
 *         defaultAddress:
 *           type: boolean
 */

/**
 * @openapi
 * components:
 *   responses:
 *     ValidationErrorResponse:
 *       description: Request failed express-validator validation.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   description: express-validator error object (errors.array() shape)
 *                   properties:
 *                     type:
 *                       type: string
 *                     value: {}
 *                     msg:
 *                       type: string
 *                     path:
 *                       type: string
 *                     location:
 *                       type: string
 *     UnauthorizedResponse:
 *       description: >
 *         Missing or invalid bearer token. Returned as
 *         {"message":"Unauthorized"} when the Authorization header is
 *         absent, or {"message":"Invalid or expired token"} when the token
 *         fails verification.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     ForbiddenResponse:
 *       description: Authenticated user is not an admin.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Admin access required
 *     NotFoundResponse:
 *       description: The requested resource does not exist.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     ServerErrorResponse:
 *       description: Unhandled error, caught by the generic Express error handler.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 */

export {};
