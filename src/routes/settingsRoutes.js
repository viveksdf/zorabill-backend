import express from "express";
import prisma from "../config/database.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/settings
 * @desc    Fetch global application settings
 * @access  Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    let settings = await prisma.setting.findFirst();
    
    // Auto-create default settings if none exist
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          shopName: "My Business",
          currency: "INR",
          invoicePrefix: "INV",
          theme: "light",
          animations: true,
          dashboardRange: "30"
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("❌ Settings Fetch Error:", error);
    res.status(500).json({ 
      error: "Failed to retrieve system configuration",
      details: error.message 
    });
  }
});

/**
 * @route   PATCH /api/settings
 * @desc    Update global application settings
 * @access  Private
 */
router.patch("/", authMiddleware, async (req, res) => {
  try {
    const rawData = req.body;
    console.log("📥 Settings Update Request:", rawData);
    
    // Whitelist valid schema fields and handle type conversions
    const allowedFields = [
      "shopName", "phone", "email", "address", "gstNumber", 
      "taxRate", "invoicePrefix", "currency", "logoUrl", 
      "theme", "animations", "autoCollapse", "maskPhoneNumbers",
      "dashboardRange", "dashStartDate", "dashEndDate"
    ];

    const data = {};
    allowedFields.forEach(field => {
      if (rawData[field] !== undefined) {
        if (field === "taxRate") {
          data[field] = parseFloat(rawData[field]) || 0;
        } else if (field === "animations" || field === "autoCollapse" || field === "maskPhoneNumbers") {
          data[field] = Boolean(rawData[field]);
        } else {
          data[field] = rawData[field];
        }
      }
    });

    let settings = await prisma.setting.findFirst();
    
    if (settings) {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } else {
      settings = await prisma.setting.create({ 
        data: {
          ...data,
          currency: data.currency || "INR"
        } 
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("❌ Settings API Error:", error);
    res.status(500).json({ 
      error: "Failed to update system configuration",
      details: error.message,
      code: error.code
    });
  }
});

export default router;
