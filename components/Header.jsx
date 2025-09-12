"use client";

import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import Link from "next/link";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { getToken, logout } from "@/lib/auth"; // adjust path

export default function Header() {
  const token = getToken();

  return (
    <AppBar
      position="fixed" // <-- fixed instead of sticky
      elevation={1}
      sx={{
        bgcolor: "#FFFFFF",
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1100,
        borderBottom: "1px solid #E0E0E0",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {token ? (
          <>
            {/* Left nav */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
              <Link href="/InvoiceDashboard" style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    borderColor: "#171717",
                    color: "#171717",
                    "&:hover": { backgroundColor: "#171717", color: "#fff" },
                  }}
                >
                  Invoice Dashboard
                </Button>
              </Link>
              <Link href="/items" style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    borderColor: "#171717",
                    color: "#171717",
                    "&:hover": { backgroundColor: "#171717", color: "#fff" },
                  }}
                >
                  All Items
                </Button>
              </Link>
            </Box>

            {/* Center logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 30, color: "#171717" }} />
              <Typography
                variant="h6"
                sx={{
                  color: "#171717",
                  fontWeight: 700,
                  fontSize: { xs: "16px", sm: "18px", md: "20px" },
                }}
              >
                Invoice App
              </Typography>
            </Box>

            {/* Right logout */}
            <Box>
              <Button
                variant="outlined"
                onClick={logout}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  borderColor: "#171717",
                  color: "#171717",
                  "&:hover": { backgroundColor: "#171717", color: "#fff" },
                }}
              >
                Logout
              </Button>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              gap: 1,
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 30, color: "#171717" }} />
            <Typography
              variant="h6"
              sx={{
                color: "#171717",
                fontWeight: 700,
                fontSize: { xs: "16px", sm: "18px", md: "20px" },
              }}
            >
              Invoice App
            </Typography>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
