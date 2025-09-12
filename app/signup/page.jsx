"use client";
import React, { useState } from "react";
import {
  Container,
  Grid,
  TextField,
  Button,
  Typography,
  Box,
  InputLabel,
  OutlinedInput,
  IconButton,
  FormHelperText,
  Paper,
  Divider,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Link from "next/link";
import { Image as ImageIcon } from "@mui/icons-material";
import api from "@/lib/api";
import { validateSignup } from "@/utils/validators";
import { storeToken } from "@/lib/auth";

export default function Signup() {
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    address: "",
    city: "",
    zip: "",
    industry: "",
    currencySymbol: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  function getPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++; // special char

    if (strength === 0) return { label: "Too Short", color: "red", value: 0 };
    if (strength <= 2) return { label: "Weak", color: "red", value: 33 };
    if (strength === 3) return { label: "Medium", color: "orange", value: 66 };
    if (strength === 4) return { label: "Strong", color: "green", value: 100 };
  }

  const { label, color, value } = getPasswordStrength(values.password || "");

  // PRD: inline error messages, required fields marked, password strength (simple)
  function onChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function handleLogo(e) {
    const f = e.target.files[0];
    if (!f) return;

    if (!["image/png", "image/jpeg"].includes(f.type)) {
      setErrors((err) => ({
        ...err,
        logo: "Invalid logo file. Use PNG or JPG.",
      }));
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setErrors((err) => ({ ...err, logo: "Logo size exceeds 5 MB." }));
      return;
    }

    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
    setErrors((err) => ({ ...err, logo: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = {
      ...values,
      firstName: values.firstName?.trim(),
      lastName: values.lastName?.trim(),
    };
    const validation = validateSignup(v);
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();

      // 🔑 Map your frontend state to API-required keys
      fd.append("FirstName", v.firstName);
      fd.append("LastName", v.lastName);
      fd.append("Email", v.email);
      fd.append("Password", v.password);
      fd.append("CompanyName", v.companyName);
      fd.append("Address", v.address);
      fd.append("City", v.city);
      fd.append("ZipCode", v.zip);
      fd.append("Industry", v.industry);
      fd.append("CurrencySymbol", v.currencySymbol);

      if (logoFile) {
        fd.append("logo", logoFile); // API expects "logo" as file
      }

      // ✅ Use full baseURL since this is external
      const res = await api.post("/Auth/Signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { token } = res.data;
      storeToken(token, true);
      window.location.href = "/";
    } catch (err) {
      const message =
        err?.response?.data?.error || "Could not sign up. Try again.";
      setErrors((e) => ({ ...e, form: message }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        bgcolor: "#fafafa",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Main Form */}
      <Container maxWidth="md" sx={{ py: 6, flex: 1 }}>
        <Typography
          align="center"
          gutterBottom
          sx={{ color: "#171717", fontSize: "30px" }}
        >
          Create Your Account
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="#525252"
          sx={{ mb: 4, fontSize: "16", mt: -1 }}
        >
          Set up your company and start invoicing in minutes.
        </Typography>
        <Paper sx={{ p: 4 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              maxWidth: 900,
              mx: "auto",

              borderRadius: 2,
              backgroundColor: "#fff",
            }}
          >
            {/* Flex wrapper for left/right + divider */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 2, md: 4 }, // smaller gap on mobile
                flexDirection: { xs: "column", md: "row" }, // stack on small, side by side on md+
              }}
            >
              {/* User Info - Left */}
              <Grid item xs={12} md={6} flex={1}>
                <Typography
                  sx={{ color: "#171717", fontSize: "18px" }}
                  gutterBottom
                  fontWeight={400}
                >
                  User Information
                </Typography>
                <Divider sx={{ my: 2 }} />
                <InputLabel
                  sx={{ mt: 2, fontSize: "14px", color: "#404040", mb: -1 }}
                >
                  First Name*
                </InputLabel>
                <TextField
                  size="small"
                  fullWidth
                  margin="normal"
                  placeholder="Enter First Name"
                  name="firstName"
                  value={values.firstName}
                  onChange={onChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#A3A3A3" },
                      "&:hover fieldset": { borderColor: "#262626" },
                      "&.Mui-focused fieldset": { borderColor: "#262626" },
                    },
                  }}
                />
                <InputLabel
                  sx={{ mt: 2, fontSize: "14px", color: "#404040", mb: -1 }}
                >
                  Last Name*
                </InputLabel>
                <TextField
                  size="small"
                  fullWidth
                  margin="normal"
                  placeholder="Enter Last Name"
                  name="lastName"
                  value={values.lastName}
                  onChange={onChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#A3A3A3" },
                      "&:hover fieldset": { borderColor: "#262626" },
                      "&.Mui-focused fieldset": { borderColor: "#262626" },
                    },
                  }}
                />
                <InputLabel
                  sx={{ mt: 2, fontSize: "14px", color: "#404040", mb: -1 }}
                >
                  Email*
                </InputLabel>
                <TextField
                  size="small"
                  fullWidth
                  margin="normal"
                  placeholder="Enter your email"
                  name="email"
                  value={values.email}
                  onChange={onChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#A3A3A3" },
                      "&:hover fieldset": { borderColor: "#262626" },
                      "&.Mui-focused fieldset": { borderColor: "#262626" },
                    },
                  }}
                />
                <InputLabel sx={{ mt: 2, fontSize: "14px", color: "#404040" }}>
                  Password*
                </InputLabel>
                <TextField
                  fullWidth
                  name="password"
                  size="small"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={onChange}
                  autoComplete="new-password"
                  placeholder="Enter Password"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#A3A3A3" },
                      "&:hover fieldset": { borderColor: "#262626" },
                      "&.Mui-focused fieldset": { borderColor: "#262626" },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  error={!!errors.password}
                  helperText={errors.password}
                />
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={value}
                    sx={{
                      height: 4,
                      borderRadius: 5,
                      backgroundColor: "#eee",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: color,
                      },
                    }}
                  />
                  {value ? (
                    <FormHelperText
                      sx={{ color }}
                    >{`Password strength: ${label}`}</FormHelperText>
                  ) : (
                    <></>
                  )}
                </Box>{" "}
              </Grid>

              {/* Company Info - Right */}
              <Grid item xs={12} md={6} flex={1}>
                <Typography
                  sx={{ color: "#171717", fontSize: "18px" }}
                  gutterBottom
                  fontWeight={400}
                >
                  Company Information
                </Typography>
                <Divider sx={{ my: 2 }} />

                <InputLabel
                  sx={{ mt: 2, fontSize: "14px", color: "#404040", mb: -1 }}
                >
                  Company Name*
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  margin="normal"
                  placeholder="Enter Company Name"
                  name="companyName"
                  value={values.companyName}
                  onChange={onChange}
                  error={!!errors.companyName}
                  helperText={errors.companyName}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#A3A3A3" },
                      "&:hover fieldset": { borderColor: "#262626" },
                      "&.Mui-focused fieldset": { borderColor: "#262626" },
                    },
                  }}
                />

                {/* Logo Upload */}
                <InputLabel
                  sx={{ mt: 2, fontSize: "14px", color: "#404040", mb: -1 }}
                >
                  Company Logo*
                </InputLabel>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        border: "1px dashed #ccc",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 2,
                        overflow: "hidden",
                      }}
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="logo preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <ImageIcon color="disabled" />
                      )}
                    </Box>

                    {/* File name + choose button */}
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #ccc",
                        borderRadius: 1,
                        height: 40,
                        overflow: "hidden",
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          whiteSpace: "nowrap",
                          width: "72px",
                          height: "34px",
                          bgcolor: "#F8F8F9",
                          mr: 2,
                          textTransform: "none",
                        }}
                        onClick={() =>
                          document.getElementById("logo-input").click()
                        }
                      >
                        Choose
                      </Button>
                      <input
                        id="logo-input"
                        hidden
                        accept="image/png, image/jpeg"
                        type="file"
                        onChange={handleLogo}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          flex: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {logoFile ? logoFile.name : "No file chosen"}
                      </Typography>
                    </Box>
                  </Box>
                  <FormHelperText>{errors.logo || "Max 2–5 MB"}</FormHelperText>
                </Box>

                <InputLabel
                  sx={{ mt: 2, fontSize: "14px", color: "#404040", mb: -1 }}
                >
                  Address*
                </InputLabel>

                <TextField
                  size="small"
                  fullWidth
                  margin="normal"
                  placeholder="Enter Company Address"
                  rows={3}
                  name="address"
                  value={values.address}
                  onChange={onChange}
                  multiline
                  error={!!errors.address}
                  helperText={errors.address}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#A3A3A3" },
                      "&:hover fieldset": { borderColor: "#262626" },
                      "&.Mui-focused fieldset": { borderColor: "#262626" },
                    },
                  }}
                />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <InputLabel
                      sx={{ mt: 2, fontSize: "14px", color: "#404040" }}
                    >
                      City*
                    </InputLabel>
                    <TextField
                      id="city"
                      size="small"
                      fullWidth
                      placeholder="Enter City"
                      name="city"
                      value={values.city}
                      onChange={onChange}
                      error={!!errors.city}
                      helperText={errors.city}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#A3A3A3" },
                          "&:hover fieldset": { borderColor: "#262626" },
                          "&.Mui-focused fieldset": { borderColor: "#262626" },
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <InputLabel
                      sx={{ mt: 2, fontSize: "14px", color: "#404040" }}
                    >
                      Zip Code*
                    </InputLabel>
                    <TextField
                      id="zip"
                      size="small"
                      fullWidth
                      placeholder="6 digit zip code"
                      name="zip"
                      value={values.zip}
                      onChange={onChange}
                      error={!!errors.zip}
                      helperText={errors.zip}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "#A3A3A3" },
                          "&:hover fieldset": { borderColor: "#262626" },
                          "&.Mui-focused fieldset": { borderColor: "#262626" },
                        },
                      }}
                    />
                  </Box>
                </Box>

                <InputLabel
                  sx={{ mt: 2, fontSize: "14px", color: "#404040", mb: -1 }}
                >
                  Industry*
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  margin="normal"
                  placeholder="Industry Type"
                  name="industry"
                  value={values.industry}
                  onChange={onChange}
                  error={!!errors.industry}
                  helperText={errors.industry}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#A3A3A3" },
                      "&:hover fieldset": { borderColor: "#262626" },
                      "&.Mui-focused fieldset": { borderColor: "#262626" },
                    },
                  }}
                />
                <InputLabel
                  sx={{ mt: 2, fontSize: "14px", color: "#404040", mb: -1 }}
                >
                  Currency Symbol*
                </InputLabel>
                <TextField
                  fullWidth
                  size="small"
                  margin="normal"
                  name="currencySymbol"
                  value={values.currencySymbol}
                  onChange={onChange}
                  placeholder="$, ₹, €, AED"
                  error={!!errors.currencySymbol}
                  helperText={errors.currencySymbol}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#A3A3A3" },
                      "&:hover fieldset": { borderColor: "#262626" },
                      "&.Mui-focused fieldset": { borderColor: "#262626" },
                    },
                  }}
                />
              </Grid>
            </Box>

            {/* Submit */}
            <Divider sx={{ my: 4 }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  backgroundColor: "#525252",
                  "&:hover": { backgroundColor: "#555" },
                }}
              >
                Sign Up
              </Button>
            </Box>

            {/* Login Link */}
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">
                Already have an account?{" "}
                <Link
                  href="/login"
                  style={{ color: "#1976d2", textDecoration: "none" }}
                >
                  Login
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
