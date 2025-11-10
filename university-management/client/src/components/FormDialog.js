import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * Reusable form dialog component
 */
const FormDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  formData,
  onChange,
  loading = false,
  isEdit = false
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field) => {
    const commonProps = {
      fullWidth: true,
      required: field.required,
      disabled: loading || field.disabled,
      margin: 'normal'
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <TextField
            {...commonProps}
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            inputProps={field.inputProps}
            multiline={field.multiline}
            rows={field.rows}
          />
        );

      case 'select':
        return (
          <FormControl {...commonProps} key={field.name}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              label={field.label}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} key={field.name}>
            <DatePicker
              label={field.label}
              value={formData[field.name] ? new Date(formData[field.name]) : null}
              onChange={(date) => onChange(field.name, date)}
              slotProps={{
                textField: {
                  ...commonProps,
                  margin: 'normal'
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                checked={formData[field.name] || false}
                onChange={(e) => onChange(field.name, e.target.checked)}
                disabled={loading || field.disabled}
              />
            }
            label={field.label}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <Grid container spacing={2}>
              {fields.map((field) => (
                <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormDialog;
