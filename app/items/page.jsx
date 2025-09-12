"use client";
import React, { useState, useEffect } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import api from "@/lib/api"; // ✅ your existing API wrapper

import Editor from "./editor/page";

export default function ItemsTable() {
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState("itemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemImages, setItemImages] = useState({});

  const handleAdd = () => {
    setSelectedItem(null);
    setEditorOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditorOpen(true);
  };

  const handleDelete = async (item) => {
    if (!item?.itemID) return;
    try {
      await api.delete(`/Item/${item.itemID}`, {
        data: {
          itemName: item.itemName,
          description: item.description,
          salesRate: item.salesRate,
          discountPct: item.discountPct,
        },
      });
      fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  useEffect(() => {
    const loadImages = async () => {
      const imagesMap = {};
      await Promise.all(
        allItems.map(async (item) => {
          if (item.itemID) {
            const url = await fetchItemImage(item.itemID);
            imagesMap[item.itemID] = url;
          }
        })
      );
      setItemImages(imagesMap);
    };

    if (allItems.length) loadImages();
  }, [allItems]);

  const fetchItemImage = async (itemID) => {
    try {
      const res = await api.get(`/Item/Picture/${itemID}`);
      return res.data?.url || res.data;
    } catch (err) {
      console.error("Error fetching image for item", itemID, err);
      return null;
    }
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setSelectedItem(null);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Item/GetList`);
      const data = res?.data?.items || res?.data || [];
      setAllItems(data);
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    let filtered = [...allItems];
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (item) =>
          item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    const total = filtered.length;
    const start = (page - 1) * rowsPerPage;
    const paginated = filtered.slice(start, start + rowsPerPage);
    setItems(paginated);
    setTotalPages(Math.max(1, Math.ceil(total / rowsPerPage)));
  }, [allItems, searchQuery, sortField, sortOrder, page, rowsPerPage]);

  const handleChangePage = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field)
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
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

  const handleExport = () => {
    if (!allItems.length) return;
    const headers = [
      "Item ID",
      "Item Name",
      "Description",
      "Sale Rate",
      "Discount %",
    ];
    const rows = allItems.map((item) => [
      item.itemID,
      item.itemName,
      item.description,
      item.salesRate,
      item.discountPct,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "items_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card
      sx={{
        boxShadow: 1,
        height: "100%",
        py: 2,
        mx: { xs: 1, sm: 2 },
        overflowX: "auto",
      }}
    >
      <CardContent sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={600}>
          Items
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Manage your product and service catalog.
        </Typography>

        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          mb={2}
          gap={1}
        >
          <TextField
            placeholder="Search items..."
            size="small"
            sx={{ width: { xs: "100%", sm: 350 } }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          <Box display="flex" gap={1} flexWrap="wrap">
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
              onClick={handleAdd}
            >
              Add New Item
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
              onClick={handleExport}
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          </Box>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            boxShadow: "none",
            maxHeight: 550,
            overflowX: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: 2,
          }}
        >
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead
              sx={{
                "& th": {
                  backgroundColor: "#FAFAFA",
                  fontWeight: 400,
                  fontSize: "14px",
                  borderBottom: "1px solid #e0e0e0",
                },
              }}
            >
              <TableRow>
                <TableCell>Picture</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    Item Name{renderSortIcons("itemName")}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    Description{renderSortIcons("description")}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    Sale Rate{renderSortIcons("salesRate")}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    Discount %{renderSortIcons("discountPct")}
                  </Box>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {itemImages[item.itemID] ? (
                        <Box
                          component="img"
                          src={itemImages[item.itemID]}
                          alt={item.itemName}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: "#f5f5f5",
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ImageIcon sx={{ color: "grey.500" }} />
                        </Box>
                      )}
                    </TableCell>

                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.salesRate}</TableCell>
                    <TableCell>{item.discountPct}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          mt={2}
          gap={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">Rows per page:</Typography>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
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
              onClick={() => handleChangePage(page - 1)}
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
              onClick={() => handleChangePage(page + 1)}
              disabled={page === totalPages}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>

      <Editor
        open={editorOpen}
        onClose={handleCloseEditor}
        item={selectedItem}
        fetchItems={fetchItems}
      />
    </Card>
  );
}
