import express from 'express';
import multer from 'multer';
import prisma from '../../lib/prisma.js';
import { validateSession } from '../../lib/auth.js';
import { uploadPhoto, getFileUrl } from '../../utils/multer.js';

const router = express.Router();

/**
 * Upload photo (accepts multipart/form-data with 'photo' field)
 * POST /api/profile/upload-photo
 */
router.post(
  '/upload-photo',
  (req, res, next) => {
    uploadPhoto(req, res, (err) => {
      if (err) {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'File size too large. Maximum size is 5MB',
            });
          }
          return res.status(400).json({
            success: false,
            error: err.message,
          });
        }
        // Handle other errors (e.g., file filter errors)
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { user } = await validateSession(req);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Photo file is required',
        });
      }

      // Get the file URL
      const photoUrl = getFileUrl(req.file.filename);

      // Update profile with photo
      let profile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      });

      if (profile) {
        profile = await prisma.userProfile.update({
          where: { userId: user.id },
          data: { photo: photoUrl },
        });
      } else {
        // Create profile if doesn't exist
        profile = await prisma.userProfile.create({
          data: {
            userId: user.id,
            fullName: user.username || 'User',
            roleType: user.loginType || 'STUDENT',
            photo: photoUrl,
          },
        });
      }

      return res.json({
        success: true,
        photoUrl: profile.photo,
      });
    } catch (err) {
      console.error('Error uploading photo:', err);
      return res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Failed to upload photo',
      });
    }
  }
);

/**
 * Update user profile
 * PATCH /api/profile/update
 */
router.patch('/update', async (req, res) => {
  try {
    const { user } = await validateSession(req);
    const {
      fullName,
      schoolName,
      roleType,
      idNumber,
      classOrPosition,
      photo,
      phone,
      address,
      guardianName,
      guardianPhone,
      bio,
      email,
    } = req.body;

    // Get or create profile
    let profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    const updateData = {};

    // Always allow "null" to clear value (to allow photo/field deletion)
    if (fullName !== undefined) updateData.fullName = fullName;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (roleType !== undefined) updateData.roleType = roleType;
    if (idNumber !== undefined) updateData.idNumber = idNumber;
    if (classOrPosition !== undefined) updateData.classOrPosition = classOrPosition;
    if (photo !== undefined) updateData.photo = photo;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (guardianName !== undefined) updateData.guardianName = guardianName;
    if (guardianPhone !== undefined) updateData.guardianPhone = guardianPhone;
    if (bio !== undefined) updateData.bio = bio;

    // Update user email if provided
    if (email !== undefined) {
      await prisma.userLogin.update({
        where: { id: user.id },
        data: { email },
      });
    }

    if (profile) {
      profile = await prisma.userProfile.update({
        where: { userId: user.id },
        data: updateData,
      });
    } else {
      // Only fill fields that exist in schema
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          fullName: fullName || user.username || 'User',
          schoolName: schoolName || null,
          roleType: roleType || user.loginType || 'STUDENT',
          idNumber: idNumber || null,
          classOrPosition: classOrPosition || null,
          photo: photo || null,
          phone: phone || null,
          address: address || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          bio: bio || null,
        },
      });
    }

    // Get updated user with email
    const updatedUser = await prisma.userLogin.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    return res.json({
      success: true,
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        schoolName: profile.schoolName,
        roleType: profile.roleType,
        idNumber: profile.idNumber,
        classOrPosition: profile.classOrPosition,
        photo: profile.photo,
        phone: profile.phone,
        address: profile.address,
        guardianName: profile.guardianName,
        guardianPhone: profile.guardianPhone,
        bio: profile.bio,
        qrId: profile.qrId,
        email: updatedUser?.email || null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to update profile',
    });
  }
});

/**
 * Get user profile
 * GET /api/profile
 */
router.get('/', async (req, res) => {
  try {
    const { user } = await validateSession(req);

    let profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return res.json({
        success: true,
        profile: null,
      });
    }

    // Get user email
    const userData = await prisma.userLogin.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    return res.json({
      success: true,
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        schoolName: profile.schoolName,
        roleType: profile.roleType,
        idNumber: profile.idNumber,
        classOrPosition: profile.classOrPosition,
        photo: profile.photo,
        phone: profile.phone,
        address: profile.address,
        guardianName: profile.guardianName,
        guardianPhone: profile.guardianPhone,
        bio: profile.bio,
        qrId: profile.qrId,
        email: userData?.email || null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error getting profile:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to get profile',
    });
  }
});

export default router;
