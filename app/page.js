"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  MenuItem,
  Select,
} from "@mui/material";
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBackIosNew as ArrowBackIosNewIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ViewColumn,
} from "@mui/icons-material";
import api from "@/lib/api";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const router = useRouter();

  // 🔹 State
  const [metrics, setMetrics] = useState({ invoiceCount: 0, totalAmount: 0 });
  const [trend, setTrend] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]); // full data
  const [invoices, setInvoices] = useState([]); // current page slice

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [sortField, setSortField] = useState("invoiceDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch Metrics
  async function fetchMetrics() {
    try {
      const res = await api.get("/Invoice/GetMetrices", {
        params: {
          from: dayjs().startOf("month").format("YYYY-MM-DD"),
          to: dayjs().endOf("month").format("YYYY-MM-DD"),
        },
      });

      // API returns an array, so take the first element
      const data =
        Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;

      setMetrics(
        data
          ? {
              invoiceCount: data.invoiceCount || 0,
              totalAmount: data.totalAmount || 0,
            }
          : { invoiceCount: 0, totalAmount: 0 }
      );
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setMetrics({ invoiceCount: 0, totalAmount: 0 });
    }
  }

  // 🔹 Fetch 12 Month Trend
  async function fetchTrend() {
    try {
      const res = await api.get("/Invoice/GetTrend12m", {
        params: { asOf: dayjs().format("YYYY-MM-DD") },
      });

      const data = Array.isArray(res.data) ? res.data : [];

      setTrend(
        data.map((item) => ({
          month: dayjs(item.monthStart).format("MMM YYYY"), // e.g. "Sep 2025"
          invoices: item.invoiceCount,
          amount: item.amountSum,
        }))
      );
    } catch (err) {
      console.error("Error fetching trend:", err);
      setTrend([]);
    }
  }

  // 🔹 Fetch Top 5 Items
  async function fetchTopItems() {
    try {
      const res = await api.get("/Invoice/TopItems", { params: { topN: 5 } });

      const data = Array.isArray(res.data) ? res.data : [];

      // Ensure keys are properly mapped
      setTopItems(
        data.map((item) => ({
          id: item.itemID,
          name: item.itemName,
          amount: item.amountSum,
        }))
      );
    } catch (err) {
      console.error("Error fetching top items:", err);
      setTopItems([]);
    }
  }

  // 🔹 Fetch Invoice List (all data once)
  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await api.get("/Invoice/GetList");
      setAllInvoices(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAllInvoices([]);
    }
    setLoading(false);
  }

  // 🔹 Apply Search + Sort + Pagination manually
  useEffect(() => {
    let filtered = [...allInvoices];

    // ✅ Search filter
    if (search) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNo?.toString().includes(search) ||
          inv.customerName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // ✅ Sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // ✅ Pagination
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    setInvoices(filtered.slice(start, end));

    // ✅ Update total pages
    setTotalPages(Math.ceil(filtered.length / rowsPerPage) || 1);
  }, [allInvoices, page, rowsPerPage, sortField, sortOrder, search]);

  // 🔹 Lifecycle
  useEffect(() => {
    fetchMetrics();
    fetchTrend();
    fetchTopItems();
    fetchInvoices();
  }, []);

  // 🔹 Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcons = (field) => (
    <Box
      component="span"
      sx={{
        ml: 0.5,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
      }}
      onClick={() => handleSort(field)}
    >
      <Box
        sx={{
          fontSize: "0.7rem",
          lineHeight: "0.7rem",
          color: sortField === field && sortOrder === "asc" ? "#000" : "#aaa",
        }}
      >
        ▲
      </Box>
      <Box
        sx={{
          fontSize: "0.7rem",
          lineHeight: "0.7rem",
          color: sortField === field && sortOrder === "desc" ? "#000" : "#aaa",
        }}
      >
        ▼
      </Box>
    </Box>
  );

  // 🔹 Export Function
  const handleExport = () => {
    const csv = [
      [
        "Invoice No",
        "Date",
        "Customer",
        "Sub-total",
        "Tax%",
        "Tax Amount",
        "Total",
      ],
      ...allInvoices.map((inv) => [
        inv.invoiceNo,
        inv.invoiceDate,
        inv.customerName,
        inv.subTotal,
        inv.taxPercentage,
        inv.taxAmount,
        inv.invoiceAmount,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // 🔹 Delete Invoice
  async function handleDelete(id) {
    try {
      await api.delete(`/Invoice/${id}`);
      // Refresh the invoice list after delete
      fetchInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Failed to delete invoice.");
    }
  }

  return (
    <Box sx={{ p: 6 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Invoices
      </Typography>

      {/* Metrics + Charts */}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr 1fr",
          },
          mb: 4,
        }}
      >
        {/* Metric Card 1 */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h4">{metrics.invoiceCount}</Typography>
            <Typography variant="body2" color="text.secondary">
              Number of Invoices
            </Typography>
          </CardContent>
        </Card>

        {/* Metric Card 2 */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h4">
              {metrics.totalAmount?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Invoice Amount
            </Typography>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card sx={{ minHeight: 180 }}>
          {" "}
          {/* ✅ only charts get height */}
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Last 12 Months
            </Typography>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={trend}>
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#1976d2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Items Chart */}
        <Card sx={{ minHeight: 180 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Top 5 Items
            </Typography>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={topItems}
                  dataKey="amount"
                  nameKey="name"
                  outerRadius={50}
                  label
                >
                  {topItems.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ["#1976d2", "#26a69a", "#ff7043", "#ab47bc", "#ffa000"][
                          i % 5
                        ]
                      }
                    />
                  ))}
                </Pie>
                {/* ✅ Smaller legend font */}
                <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Invoice List */}
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Search + Actions */}
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }} // ✅ responsive
            justifyContent="space-between"
            gap={2}
            mb={3}
          >
            <TextField
              placeholder="Search invoices..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: "100%", sm: 300 } }}
            />
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  borderColor: "#171717 !important", // force border
                  color: "#171717 !important", // force text color
                  "&:hover": {
                    backgroundColor: "#171717 !important",
                    color: "#fff !important",
                    borderColor: "#171717 !important",
                  },
                }}
                startIcon={<AddIcon />}
                onClick={() => router.push("/invoice/editor")}
              >
                New Invoice
              </Button>

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
                startIcon={<DownloadIcon />}
                onClick={handleExport}
              >
                Export
              </Button>

              <Button
                variant="outlined"
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
                startIcon={<ViewColumn />}
              >
                Columns
              </Button>
            </Box>
          </Box>

          {/* Table */}
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Date {renderSortIcons("invoiceDate")}</TableCell>
                  <TableCell>
                    Customer {renderSortIcons("customerName")}
                  </TableCell>
                  <TableCell>Sub-total {renderSortIcons("subTotal")}</TableCell>
                  <TableCell>Tax%</TableCell>
                  <TableCell>Tax Amount</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{inv.invoiceNo}</TableCell>
                      <TableCell>
                        {dayjs(inv.invoiceDate).format("YYYY-MM-DD")}
                      </TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell>{inv.subTotal}</TableCell>
                      <TableCell>{inv.taxPercentage}</TableCell>
                      <TableCell>{inv.taxAmount}</TableCell>
                      <TableCell>{inv.invoiceAmount}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() =>
                            router.push(`/invoice/editor?id=${inv.invoiceID}`)
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(inv.invoiceID)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }} // ✅ responsive
            justifyContent="space-between"
            alignItems="center"
            mt={3}
            gap={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">Rows per page:</Typography>
              <Select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                size="small"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </Box>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <IconButton
                size="small"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "contained" : "text"}
                  size="small"
                  onClick={() => setPage(i + 1)}
                  sx={{
                    minWidth: 36,
                    fontWeight: 500,
                    borderRadius: "8px",
                    color: page === i + 1 ? "#fff" : "#171717",
                    backgroundColor: page === i + 1 ? "#171717" : "transparent",
                    "&:hover": {
                      backgroundColor:
                        page === i + 1 ? "#333" : "rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  {i + 1}
                </Button>
              ))}
              <IconButton
                size="small"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
