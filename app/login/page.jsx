"use client";
import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  IconButton,
  Alert,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from "../../lib/api";
import { validateLogin } from "../../utils/validators";
import { storeToken } from "../../lib/auth";
import Link from "next/link";

export default function Login() {
  const [values, setValues] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    // Validate inputs
    const validation = validateLogin(values);
    if (Object.keys(validation).length) {
      return setErrors(validation);
    }

    setLoading(true);
    try {
      const res = await api.post("/Auth/Login", values, {
        headers: { "Content-Type": "application/json" },
      });

      storeToken(res.data.token, values.rememberMe);
      window.location.href = "/";
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Email or password is incorrect.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#FAFAFA",
        mt: -10,
      }}
    >
      {/* Centered Form */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
        <Container maxWidth="sm">
          <Typography
            variant="h4"
            gutterBottom
            sx={{ display: "flex", justifyContent: "center", color: "#171717" }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "center",
              color: "#525252",
            }}
          >
            Log in to your account.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              textAlign: "center",
            }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ textAlign: "left" }}
            >
              {serverError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {serverError}
                </Alert>
              )}

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Email Address*
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your email"
                name="email"
                value={values.email}
                onChange={onChange}
                size="small"
                autoComplete="off"
                inputProps={{ autoComplete: "off" }}
                error={!!errors.email}
                helperText={errors.email}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&.Mui-focused fieldset": {
                      borderColor: "#262626",
                    },
                  },
                }}
              />
              <Typography variant="subtitle2" sx={{ mb: 1, color: "#404040" }}>
                Password*
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? "text" : "password"}
                size="small"
                placeholder="Enter password"
                name="password"
                value={values.password}
                onChange={onChange}
                autoComplete="new-password"
                inputProps={{ autoComplete: "new-password" }}
                error={!!errors.password}
                helperText={errors.password}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&.Mui-focused fieldset": {
                      borderColor: "#262626",
                    },
                  },
                }}
                InputProps={{
                  sx: { borderRadius: 2 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        aria-label="toggle password"
                        sx={{ color: "#666" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={values.rememberMe}
                    onChange={onChange}
                    sx={{ color: "#404040" }}
                  />
                }
                label="Remember me"
                sx={{ color: "#404040" }}
              />

              <Box sx={{ display: "flex", justifyContent: "end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    color: "#FFFFFF",
                    bgcolor: "#525252",
                    "&:hover": { bgcolor: "#111" },
                    textTransform: "none",
                  }}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Link
                href="/signup"
                style={{ color: "#525252", textDecoration: "none" }}
              >
                Create Account
              </Link>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
