import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import db from "../config/Database.js";

// Get current directory (ES Module equivalent of __dirname)
export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createUser = async (req, res) => {
  const { email, password, name, phone_number } = req.body;
  try {
    await User.create({ email, password, name, phone_number });
    res.status(201).json({ msg: "User created" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { email, name, phone_number } = req.body;
  try {
    await User.update(
      { email, name, phone_number },
      { where: { user_id } }
    );
    res.json({ msg: "User updated" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    await User.destroy({ where: { user_id } });
    res.json({ msg: "User deleted" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { email, name, phone_number, address, current_password, new_password } = req.body;
    
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

    // Build update data with only provided fields
    const updateData = {};
    if (email !== undefined) updateData.email = email; // Check for undefined to allow clearing fields
    if (name !== undefined) updateData.name = name;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (address !== undefined) updateData.address = address;

    // Handle password update
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ msg: "Password saat ini diperlukan untuk mengubah password." });
      }
      const match = await bcrypt.compare(current_password, user.password);
      if (!match) {
        return res.status(401).json({ msg: "Password saat ini salah." });
      }
      updateData.password = await bcrypt.hash(new_password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ msg: "Tidak ada data yang diubah" });
    }

    await User.update(updateData, { where: { user_id: req.userId } });
    
    // Return updated user data (excluding password)
    const updatedUser = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] }
    });
    
    res.json({ 
      msg: "Profil berhasil diupdate",
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(400).json({ msg: error.message });
  }
};

// Admin function - Get all users (optional, if needed)
export const getAllUsers = async (req, res) => {
  try {
    // Add admin role check here if you have roles
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Admin function - Delete user (optional, if needed)
export const deleteUserById = async (req, res) => {
  const { user_id } = req.params;
  try {
    // Add admin role check here
    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    await User.destroy({ where: { user_id } });
    res.json({ msg: "User berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const user_id = req.userId;
    const { password } = req.body;
    
    // Find user
    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    
    // Verify password for security
    if (password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ msg: "Password salah, verifikasi gagal" });
      }
    }
    
    // Begin transaction to ensure all related operations complete or rollback
    const transaction = await db.transaction();
    
    try {
      // Delete user's barangs
      await Barang.destroy({ where: { user_id }, transaction });
      console.log(`Deleted all items for user ${user_id}`);
      
      // Delete user's transactions - both as buyer and seller
      await Transaksi.destroy({ 
        where: { 
          [Op.or]: [{ buyer_id: user_id }, { seller_id: user_id }] 
        }, 
        transaction 
      });
      console.log(`Deleted all transactions for user ${user_id}`);
      
      // Finally delete the user
      await User.destroy({ where: { user_id }, transaction });
      console.log(`Deleted user ${user_id}`);
      
      await transaction.commit();
      
      // Return success response
      res.json({ msg: "Akun berhasil dihapus. Semua data terkait telah dihapus." });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ msg: error.message });
  }
};

