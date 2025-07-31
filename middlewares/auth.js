import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(404).json({ error: "Access Denied! No token found" });
  }

  try {
    //verify the jwt token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //Adding extrated data of token with req so that next middleware can get the token data
    req.user = decoded;
    next(); //passing data to next route/middleware
    
  } catch (error) {
    return res.status(401).json({ error: "Something wrong with token." });
  }
};
