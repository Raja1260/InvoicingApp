import { createContext, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

let globalEnqueue = null;

export function SnackbarProvider({ children }) {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  globalEnqueue = (message, options = {}) => {
    setSnackbar({ open: true, message, severity: options.variant || "info" });
  };

  const handleClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleClose}
        
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// function to call from anywhere
export const enqueueSnackbar = (message, options) => {
  if (globalEnqueue) globalEnqueue(message, options);
  else console.warn("Snackbar not initialized yet:", message);
};