import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Store refresh tokens - in production, use Redis or database
let refreshTokens = [];

// Ensure token secrets are set, with fallbacks for development
const _ACCESS_TOKEN_SECRET =
  process.env._ACCESS_TOKEN_SECRET || "access_secret_dev_key";
const _REFRESH_TOKEN_SECRET =
  process.env._REFRESH_TOKEN_SECRET || "refresh_secret_dev_key";

export const register = async (req, res) => {
  const { email, password, name, phone_number, profile_picture } = req.body;
  if (!email || !password || !name)
    return res
      .status(400)
      .json({ msg: "Email, password, dan name wajib diisi" });

  try {
    const exist = await User.findOne({ where: { email } });
    if (exist) return res.status(409).json({ msg: "Email sudah terdaftar" });

    const hash = await bcrypt.hash(password, 10);
    await User.create({
      email,
      password: hash,
      name,
      phone_number,
      profile_picture,
    });
    res.status(201).json({ msg: "Register berhasil" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: "Email dan password wajib diisi" });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Password salah" });

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      { user_id: user.user_id, email: user.email },
      _ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" } // Added expiresIn
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { user_id: user.user_id, email: user.email },
      _REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Store refresh token
    refreshTokens.push(refreshToken);

    // Return user data and tokens
    res.json({
      accessToken,
      refreshToken,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        profile_picture: user.profile_picture,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: err.message });
  }
};

export const refreshToken = (req, res) => {
  const refreshToken = req.body.refreshToken;

  // Check if refresh token provided
  if (!refreshToken) {
    return res.status(401).json({ msg: "Refresh token tidak ditemukan" });
  }

  // Check if refresh token is valid
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ msg: "Refresh token tidak valid" });
  }

  // Verify the refresh token
  jwt.verify(refreshToken, _REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ msg: "Verifikasi refresh token gagal" });
    }

    // Create new access token
    const accessToken = jwt.sign(
      { user_id: decoded.user_id, email: decoded.email },
      _ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // Return new access token
    res.json({ accessToken });
  });
};

export const logout = (req, res) => {
  const refreshToken = req.body.refreshToken;

  // Remove the refresh token from the list
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

  res.status(200).json({ msg: "Logout berhasil" });
};
