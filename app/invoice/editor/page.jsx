"use client";
import React, { useState, useEffect } from "react";
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Container,
  Divider,
  Autocomplete,
} from "@mui/material";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { ContentCopy } from "@mui/icons-material";
import api from "@/lib/api";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";

export default function InvoiceEditor() {
  const searchParams = useSearchParams();
  const invoiceID = searchParams.get("id"); // ?id=1 for editing

  const [header, setHeader] = useState({
    invoiceID: 0,
    invoiceNo: "",
    invoiceDate: dayjs().format("YYYY-MM-DD"),
    customerName: "",
    address: "",
    city: "",
    taxPercentage: 0,
    taxAmount: 0,
    notes: "",
    subTotal: 0,
    invoiceAmount: 0,
  });

  const [lines, setLines] = useState([
    {
      rowNo: 1,
      itemID: "",
      description: "",
      quantity: 0,
      rate: 0,
      discountPct: 0,
      amount: 0,
    },
  ]);

  const [items, setItems] = useState([]); // 🔹 items from API
  const [errors, setErrors] = useState({});

  // 🔹 Load invoice if editing
  useEffect(() => {
    if (invoiceID) {
      loadInvoice(invoiceID);
    }
  }, [invoiceID]);

  async function loadInvoice(id) {
    try {
      const res = await api.get(`/Invoice/${id}`);
      const data = res.data;
      setHeader({
        invoiceID: data.invoiceID,
        invoiceNo: data.invoiceNo,
        invoiceDate: dayjs(data.invoiceDate).format("YYYY-MM-DD"),
        customerName: data.customerName,
        address: data.address,
        city: data.city,
        taxPercentage: data.taxPercentage,
        taxAmount: data.taxAmount,
        notes: data.notes,
        subTotal: data.subTotal,
        invoiceAmount: data.invoiceAmount,
      });

      setLines(
        data.lines.map((l, idx) => {
          const qty = Number(l.quantity) || 0;
          const rate = Number(l.rate) || 0;
          const disc = Number(l.discountPct) || 0;
          const amt = +(qty * rate * (1 - disc / 100)).toFixed(2);

          return {
            rowNo: idx + 1,
            itemID: l.itemID,
            description: l.description,
            quantity: qty,
            rate: rate,
            discountPct: disc,
            amount: amt,
          };
        })
      );
    } catch (err) {
      console.error(err);
      alert("Could not load invoice.");
    }
  }

  // 🔹 Load items for dropdown
  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await api.get(
          "https://alitinvoiceappapi.azurewebsites.net/api/Item/GetList"
        );
        setItems(res.data);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    }
    fetchItems();
  }, []);

  useEffect(() => {
    recalc();
  }, [lines, header.taxPercentage, header.taxAmount]);

  function addLine() {
    setLines((l) => [
      ...l,
      {
        rowNo: l.length + 1,
        itemID: "",
        description: "",
        quantity: 0,
        rate: 0,
        discountPct: 0,
        amount: 0,
      },
    ]);
  }

  function removeLine(index) {
    setLines((l) => l.filter((_, i) => i !== index));
  }

  function handleItemSelect(index, item) {
    setLines((l) => {
      const next = [...l];
      next[index] = {
        ...next[index],
        itemID: item.itemID,
        description: item.description,
        rate: item.salesRate,
        discountPct: item.discountPct,
      };
      const qty = Number(next[index].quantity) || 0;
      const amt = +(
        qty *
        item.salesRate *
        (1 - item.discountPct / 100)
      ).toFixed(2);
      next[index].amount = amt;
      return next;
    });
  }

  function handleLineChange(index, key, value) {
    setLines((l) => {
      const next = [...l];
      next[index] = { ...next[index], [key]: value };

      const qty = Number(next[index].quantity) || 0;
      const rate = Number(next[index].rate) || 0;
      const disc = Number(next[index].discountPct) || 0;
      const amt = +(qty * rate * (1 - disc / 100)).toFixed(2);
      next[index].amount = amt;

      return next;
    });
  }

  function recalc() {
    const subTotal = lines.reduce((s, r) => s + Number(r.amount || 0), 0);
    const taxPct = Number(header.taxPercentage || 0);
    const taxAmount = +((subTotal * taxPct) / 100).toFixed(2);
    setHeader((h) => ({
      ...h,
      subTotal: +subTotal.toFixed(2),
      taxAmount: taxAmount,
      invoiceAmount: +(subTotal + taxAmount).toFixed(2),
    }));
  }

  function validateBeforeSave() {
    const errs = {};
    if (!header.customerName || !header.customerName.trim())
      errs.customerName = "Enter name.";
    const atLeastOne = lines.some((l) => Number(l.quantity) > 0 && l.itemID);
    if (!atLeastOne) errs.lines = "Add at least one line with Qty > 0.";
    const invalidLine = lines.find(
      (l) =>
        !l.itemID ||
        Number(l.rate) < 0 ||
        Number(l.discountPct) < 0 ||
        Number(l.discountPct) > 100
    );
    if (invalidLine)
      errs.lines = "Check line items: item required, rate >=0, disc 0–100.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validateBeforeSave()) return;
    try {
      const payload = {
        model: "Invoice",
        invoiceID: header.invoiceID || 0,
        invoiceNo: header.invoiceNo ? Number(header.invoiceNo) : null,
        invoiceDate: header.invoiceDate,
        customerName: header.customerName.trim(),
        address: header.address,
        city: header.city,
        taxPercentage: Number(header.taxPercentage),
        taxAmount: Number(header.taxAmount),
        notes: header.notes,
        lines: lines.map((l, idx) => ({
          rowNo: idx + 1,
          itemID: l.itemID || null,
          description: l.description,
          quantity: Number(l.quantity),
          rate: Number(l.rate),
          discountPct: Number(l.discountPct),
          amount: Number(l.amount),
        })),
      };

      if (payload.invoiceID && payload.invoiceID > 0) {
        await api.put("/Invoice/", payload);
      } else {
        await api.post("/Invoice/", payload);
      }

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Could not save invoice.");
    }
  }

  return (
    <Container
      maxWidth="2xl"
      sx={{ bgcolor: "#FAFAFA", display: "flex", justifyContent: "center" }}
    >
      <Paper sx={{ width: "100%", mt: 3 }}>
        <AppBar
          position="static"
          sx={{
            boxShadow: "none",
            bgcolor: "white",
            px: { xs: 2, sm: 3 },
            py: 4,
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: { xs: 2, sm: 0 },
            }}
          >
            <Link href="/" style={{ textDecoration: "none" }}>
              <Typography
                variant="h6"
                sx={{
                  color: "#262626",
                  fontWeight: 600,
                  fontSize: { xs: "18px", sm: "20px", md: "24px" },
                }}
              >
                {header.invoiceID ? "Edit Invoice" : "New Invoice"}
              </Typography>
            </Link>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                justifyContent: { xs: "flex-start", sm: "flex-end" },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <Button
                variant="outlined"
                href="/"
                sx={{
                  color: "#171717",
                  bgcolor: "#fff",
                  borderColor: "#171717",
                  textTransform: "none", // ✅ keep text as typed
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={handleSave}
                sx={{
                  backgroundColor: "#171717",
                  color: "#fff",
                  textTransform: "none", // ✅ keep text as typed
                }}
              >
                Save
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* 🔹 Invoice Details */}
        <Container maxWidth="lg" sx={{ flex: 1 }}>
          <Box sx={{ p: 3, mb: 3, bgcolor: "#FFFFFF" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Invoice Details
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Invoice No + Date */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">Invoice No</Typography>
                  <TextField
                    placeholder="INV-001"
                    value={header.invoiceNo}
                    onChange={(e) =>
                      setHeader({ ...header, invoiceNo: e.target.value })
                    }
                    size="small"
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">Invoice Date *</Typography>
                  <TextField
                    type="date"
                    value={header.invoiceDate}
                    onChange={(e) =>
                      setHeader({ ...header, invoiceDate: e.target.value })
                    }
                    size="small"
                    fullWidth
                  />
                </Box>
              </Box>

              {/* Customer Name + City */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">Customer Name *</Typography>
                  <TextField
                    placeholder="Enter customer name"
                    value={header.customerName}
                    onChange={(e) =>
                      setHeader({ ...header, customerName: e.target.value })
                    }
                    size="small"
                    fullWidth
                    helperText={errors.customerName}
                    error={!!errors.customerName}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">City</Typography>
                  <TextField
                    placeholder="Enter city"
                    value={header.city}
                    onChange={(e) =>
                      setHeader({ ...header, city: e.target.value })
                    }
                    size="small"
                    fullWidth
                  />
                </Box>
              </Box>

              {/* Address + Notes */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">Address</Typography>
                  <TextField
                    placeholder="Enter address"
                    value={header.address}
                    onChange={(e) =>
                      setHeader({ ...header, address: e.target.value })
                    }
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">Notes</Typography>
                  <TextField
                    placeholder="Additional notes"
                    value={header.notes}
                    onChange={(e) =>
                      setHeader({ ...header, notes: e.target.value })
                    }
                    size="small"
                    multiline
                    rows={3}
                    fullWidth
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>

        {/* 🔹 Line Items */}
        <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
          <Box sx={{ p: 3, mb: 3, bgcolor: "#FFFFFF" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 2,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="h6">Line Items</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Button
                  variant="outlined" // 🔹 add variant to make styles apply
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    borderColor: "#171717 !important",
                    color: "#171717 !important",
                    "&:hover": {
                      backgroundColor: "#171717 !important",
                      color: "#fff !important",
                      borderColor: "#171717 !important",
                    },
                  }}
                  onClick={addLine}
                  startIcon={<AddIcon />}
                >
                  Add Row
                </Button>
                {/* <Button
                  variant="outlined" // 🔹 add variant to make styles apply
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  borderColor: "#171717 !important",
                  color: "#171717 !important",
                  "&:hover": {
                    backgroundColor: "#171717 !important",
                    color: "#fff !important",
                    borderColor: "#171717 !important",
                  },
                }}
                  
                  startIcon={<ContentCopy />}
                >
                  Copy
                </Button> */}
                <Button
                  variant="outlined" // 🔹 add variant to make styles apply
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    borderColor: "#171717 !important",
                    color: "#171717 !important",
                    "&:hover": {
                      backgroundColor: "#171717 !important",
                      color: "#fff !important",
                      borderColor: "#171717 !important",
                    },
                  }}
                  startIcon={<DeleteIcon />}
                  onClick={() => removeLine(lines.length - 1)}
                >
                  Delete
                </Button>
              </Box>
            </Box>

            {/* Header Row */}
            <Box sx={{ overflowX: "auto", maxHeight: 300 }}>
              <Box
                sx={{
                  display: "flex",
                  fontWeight: "bold",
                  mb: 1,
                  bgcolor: "#E5E7EB",
                  py: 1,
                  borderRadius: 1,
                  minWidth: "800px",
                }}
              >
                <Box sx={{ flex: 0.5, textAlign: "center" }}>S.No</Box>
                <Box sx={{ flex: 2 }}>Item *</Box>
                <Box sx={{ flex: 2 }}>Description</Box>
                <Box sx={{ flex: 1 }}>Qty *</Box>
                <Box sx={{ flex: 1 }}>Rate *</Box>
                <Box sx={{ flex: 1 }}>Disc %</Box>
                <Box sx={{ flex: 1.5 }}>Amount</Box>
              </Box>

              {/* Dynamic Rows */}
              {lines.map((l, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    py: 1,
                    minWidth: "800px",
                  }}
                >
                  <Box sx={{ flex: 0.5, textAlign: "center" }}>{idx + 1}</Box>

                  {/* Item Dropdown */}
                  <Box sx={{ flex: 2, pr: 1 }}>
                    <Autocomplete
                      options={items}
                      getOptionLabel={(option) => option.itemName || ""}
                      value={items.find((it) => it.itemID === l.itemID) || null}
                      onChange={(_, newVal) => {
                        if (newVal) handleItemSelect(idx, newVal);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select item..."
                          size="small"
                        />
                      )}
                    />
                  </Box>

                  {/* Description */}
                  <Box sx={{ flex: 2, pr: 1 }}>
                    <TextField
                      placeholder="Description"
                      value={l.description}
                      onChange={(e) =>
                        handleLineChange(idx, "description", e.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Box>

                  {/* Qty */}
                  <Box sx={{ flex: 1, pr: 1 }}>
                    <TextField
                      type="number"
                      value={l.quantity}
                      onChange={(e) =>
                        handleLineChange(idx, "quantity", e.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Box>

                  {/* Rate */}
                  <Box sx={{ flex: 1, pr: 1 }}>
                    <TextField
                      type="number"
                      value={l.rate}
                      onChange={(e) =>
                        handleLineChange(idx, "rate", e.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Box>

                  {/* Discount */}
                  <Box sx={{ flex: 1, pr: 1 }}>
                    <TextField
                      type="number"
                      value={l.discountPct}
                      onChange={(e) =>
                        handleLineChange(idx, "discountPct", e.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </Box>

                  {/* Amount */}
                  <Box sx={{ flex: 1.5 }}>
                    <TextField
                      value={Number(l.amount).toFixed(2)}
                      InputProps={{ readOnly: true }}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ textAlign: "right", mt: 2, bgcolor: "#E5E7EB" }}>
              <Typography variant="subtitle2">
                Subtotal: ₹{header.subTotal?.toFixed(2) || "0.00"}
              </Typography>
            </Box>
          </Box>
        </Container>

        {/* 🔹 Invoice Totals */}
        <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Invoice Totals
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "stretch", sm: "flex-end" },
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: { xs: "100%", sm: 300 },
                  p: 2,
                }}
              >
                <Typography variant="body2">Sub Total</Typography>
                <Typography variant="body2">
                  ₹{header.subTotal?.toFixed(2) || "0.00"}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                <Typography variant="body2">Tax</Typography>
                <TextField
                  placeholder="0"
                  value={header.taxPercentage}
                  onChange={(e) =>
                    setHeader({ ...header, taxPercentage: e.target.value })
                  }
                  size="small"
                  sx={{ maxWidth: 100 }}
                />
                <TextField
                  placeholder="0.00"
                  value={header.taxAmount}
                  size="small"
                  sx={{ maxWidth: 120 }}
                  InputProps={{ readOnly: true }}
                />
              </Box>
              <Box sx={{ width: "100%", borderTop: "1px solid #eee", my: 1 }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: { xs: "100%", sm: 300 },
                  bgcolor: "#f5f5f5",
                  p: 2,
                }}
              >
                <Typography variant="body2">Invoice Amount</Typography>
                <Typography variant="h6" fontWeight={600}>
                  ₹{header.invoiceAmount?.toFixed(2) || "0.00"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Paper>
    </Container>
  );
}
