import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../components/DataTable';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import Notification from '../components/Notification';
import useCrud from '../hooks/useCrud';
import { departmentService } from '../services/api';

const Departments = () => {
  const {
    data,
    loading,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    totalCount,
    create,
    update,
    remove
  } = useCrud(departmentService);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const columns = [
    { field: 'code', headerName: 'Code', minWidth: 100 },
    { field: 'name', headerName: 'Name', minWidth: 200 },
    { field: 'building', headerName: 'Building', minWidth: 150 },
    { field: 'phone', headerName: 'Phone', minWidth: 150 },
    { field: 'email', headerName: 'Email', minWidth: 200 }
  ];

  const formFields = [
    { name: 'code', label: 'Department Code', type: 'text', required: true },
    { name: 'name', label: 'Department Name', type: 'text', required: true, fullWidth: true },
    { name: 'description', label: 'Description', type: 'text', multiline: true, rows: 3, fullWidth: true },
    { name: 'building', label: 'Building', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' }
  ];

  const handleAdd = () => {
    setFormData({});
    setIsEdit(false);
    setFormOpen(true);
  };

  const handleEdit = (row) => {
    setFormData(row);
    setIsEdit(true);
    setFormOpen(true);
  };

  const handleDelete = (row) => {
    setDeleteDialog({ open: true, item: row });
  };

  const handleFormChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    const result = isEdit
      ? await update(formData.id, formData)
      : await create(formData);

    if (result.success) {
      setFormOpen(false);
      setNotification({
        open: true,
        message: `Department ${isEdit ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    } else {
      setNotification({
        open: true,
        message: result.error,
        severity: 'error'
      });
    }
  };

  const handleConfirmDelete = async () => {
    const result = await remove(deleteDialog.item.id);
    setDeleteDialog({ open: false, item: null });

    if (result.success) {
      setNotification({
        open: true,
        message: 'Department deleted successfully',
        severity: 'success'
      });
    } else {
      setNotification({
        open: true,
        message: result.error,
        severity: 'error'
      });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Departments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Department
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        title={isEdit ? 'Edit Department' : 'Add Department'}
        fields={formFields}
        formData={formData}
        onChange={handleFormChange}
        isEdit={isEdit}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteDialog.item?.name}"?`}
        confirmText="Delete"
        confirmColor="error"
      />

      <Notification
        open={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
        severity={notification.severity}
      />
    </Box>
  );
};

export default Departments;
