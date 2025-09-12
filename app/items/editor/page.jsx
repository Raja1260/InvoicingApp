"use client";
import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Stack,
  Divider,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import api from "@/lib/api";
import { validateItem } from "@/utils/validators";

export default function Editor({ item, open, onClose, fetchItems }) {
  const isNew = !item;

  const [values, setValues] = useState({
    itemName: "",
    description: "",
    saleRate: "",
    discountPct: 0,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  function resetForm() {
    setValues({
      itemName: "",
      description: "",
      saleRate: "",
      discountPct: 0,
    });
    setErrors({});
    setLogoFile(null);
    setLogoPreview("");
  }

  const fetchItemImage = async (itemID) => {
    try {
      const res = await api.get(`/Item/Picture/${itemID}`);
      return res.data?.url || res.data;
    } catch (err) {
      console.error("Error fetching image for item", itemID, err);
      return null;
    }
  };

  useEffect(() => {
    if (item) {
      setValues({
        itemName: item.itemName || "",
        description: item.description || "",
        saleRate: item.salesRate || "",
        discountPct: item.discountPct || 0,
      });

      const loadImage = async () => {
        if (item.itemID) {
          const url = await fetchItemImage(item.itemID);
          setLogoPreview(url || "");
        }
      };
      loadImage();
    }
  }, [item]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  function onChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSave() {
    const validation = validateItem(values);
    if (Object.keys(validation).length) return setErrors(validation);

    setLoading(true);
    try {
      if (isNew) {
        const payload = {
          itemName: values.itemName.trim(),
          description: values.description?.trim(),
          salesRate: Number(Number(values.saleRate).toFixed(2)),
          discountPct: Number(values.discountPct),
        };
        const res = await api.post("/Item", payload);

        if (logoFile && res.data?.primaryKeyID) {
          const formData = new FormData();
          formData.append("itemID", res.data.primaryKeyID);
          formData.append("File", logoFile);
          await api.post("/Item/UpdateItemPicture", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        const payload = {
          itemID: item.itemID,
          itemName: values.itemName.trim(),
          description: values.description?.trim(),
          salesRate: Number(Number(values.saleRate).toFixed(2)),
          discountPct: Number(values.discountPct),
        };
        await api.put(`/Item`, payload);

        if (logoFile) {
          const formData = new FormData();
          formData.append("itemID", item.itemID);
          formData.append("File", logoFile);
          await api.post("/Item/UpdateItemPicture", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      fetchItems();
      resetForm(); // ✅ reset form
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ form: "Could not save item." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm(); // ✅ reset when closing/cancel
        onClose();
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: 680 } }}
    >
      <DialogTitle sx={{ fontSize: 20, fontWeight: 400, color: "#171717" }}>
        {isNew ? "New Item" : "Edit Item"}
      </DialogTitle>
      <Divider />

      <DialogContent>
        <Stack spacing={3} sx={{ py: 1 }}>
          {/* Picture row */}
          <Box>
            <Typography sx={{ color: "#404040", fontSize: "14px", mb: 1 }}>
              Item Picture
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
              }}
            >
              <Box
                sx={{
                  border: "2px dashed #d0d0d0",
                  borderRadius: 2,
                  width: { xs: 72, sm: 96 },
                  height: { xs: 72, sm: 96 },
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  bgcolor: logoPreview ? "transparent" : "#f5f5f5",
                  color: "text.secondary",
                }}
              >
                {logoPreview ? (
                  <Box
                    component="img"
                    src={logoPreview}
                    alt={"preview"}
                    sx={{
                      width: { xs: 96 * 0.75, sm: 96 },
                      height: { xs: 96 * 0.75, sm: 96 },
                      objectFit: "cover",
                      borderRadius: 2,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      color: "#737373",
                    }}
                  >
                    <ImageIcon fontSize="small" />
                    <Box component="span" sx={{ fontSize: 12 }}>
                      Preview
                    </Box>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFile}
                  style={{
                    border: "1px solid #999",
                    borderRadius: 4,
                    padding: "6px 8px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  PNG or JPG, max 5MB
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Item fields */}
          <Box>
            <Typography sx={{ color: "#404040", fontSize: "14px" }}>
              Item Name*
            </Typography>
            <TextField
              fullWidth
              size="small"
              name="itemName"
              placeholder="Enter item name"
              value={values.itemName}
              onChange={onChange}
            />
          </Box>

          <Box>
            <Typography sx={{ color: "#404040", fontSize: "14px" }}>
              Item Description*
            </Typography>
            <TextField
              fullWidth
              name="description"
              size="small"
              placeholder="Enter item description"
              value={values.description}
              onChange={onChange}
              multiline
              minRows={5}
              inputProps={{ maxLength: 500 }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {`${values.description.length}/500`}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: "#404040", fontSize: "14px" }}>
                Sale Rate*
              </Typography>
              <TextField
                fullWidth
                name="saleRate"
                placeholder="0.00"
                value={values.saleRate}
                size="small"
                onChange={onChange}
                type="number"
                inputProps={{ style: { textAlign: "right" } }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: "#404040", fontSize: "14px" }}>
                Discount %
              </Typography>
              <TextField
                fullWidth
                name="discountPct"
                placeholder="0 %"
                size="small"
                value={values.discountPct}
                onChange={onChange}
                type="number"
                inputProps={{ style: { textAlign: "right" } }}
              />
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: "1px solid #eee" }}>
        <Button
          onClick={() => {
            resetForm(); // ✅ reset when closing/cancel
            onClose();
          }}
          sx={{
            color: "text.secondary",
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSave}
          sx={{
            backgroundColor: "#333",
            "&:hover": { backgroundColor: "#555" },
            textTransform: "none",
          }}
        >
          {isNew ? "Save" : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
