import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, userAdmissionNumber, userRole, res) => {
  const token = jwt.sign({ id: userId, admissionNumber: userAdmissionNumber, role: userRole }, "TS3YwEB1SXlslDn7+484zQevc+j7m/4t9SDEvCM25Yw=", {
    expiresIn: "1h",  // Token validity
  });

  res.cookie("jwt", token, {
    maxAge: 60 * 60 * 1000,  // 1 hour in milliseconds
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });
  return token;
};


export default generateTokenAndSetCookie;
