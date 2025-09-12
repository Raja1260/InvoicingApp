"use client";

import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Header from "../components/Header";
import "../app/globals.css";
import AuthGuard from "@/components/AuthComponents";
import { usePathname } from "next/navigation";
import { SnackbarProvider } from "@/components/Snackbar";

const theme = createTheme({
  palette: { primary: { main: "#1976d2" } },
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/login" || pathname === "/signup";

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <SnackbarProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Header />

            <div
              style={{
                marginTop: "64px", // height of fixed header
                minHeight: "calc(100vh - 64px)",
                overflowY: "auto",
              }}
            >
              {!isPublicRoute ? <AuthGuard>{children}</AuthGuard> : children}
            </div>

            <footer style={{ textAlign: "center", padding: "16px" }}>
              © {new Date().getFullYear()} Invoicing App
            </footer>
          </ThemeProvider>
        </SnackbarProvider>
      </body>
    </html>
  );
}
