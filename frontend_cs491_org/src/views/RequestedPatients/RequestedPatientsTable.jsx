import {
    Box,
    CircularProgress,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Chip,
    IconButton,
    DialogContentText,
    Typography,
    TextField,
    Modal,
  } from '@material-ui/core'
  import { ArrowForward, Info, Note } from '@material-ui/icons'
  import WarningIcon from '@mui/icons-material/Warning';
  import MUIDataTable from 'mui-datatables'
  import React, { useState, useEffect } from 'react'
  import { useNavigate } from 'react-router-dom'
  import DeleteIcon from '@material-ui/icons/Delete'
  import { fDateTime } from 'src/utils/formatTime'
  import { annotateFile, updateFinishInfo, updateFileNotes, fecthMedicalCenterPatients, deletePatient, fetchRequestedMedicalCenterPatients } from '../../api/file'
  import { PATH_DASHBOARD, ROOTS_PrioVar } from '../../routes/paths'
  import axios from '../../utils/axios'
  import { Link as RouterLink } from 'react-router-dom'
  import ExpandOnClick from 'src/components/ExpandOnClick'
  import Label from 'src/components/Label'
  import VariantDasboard2 from '../common/VariantDasboard2'
  
  const EditableNote = ({ note, onSave, details }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [currentNote, setCurrentNote] = useState(note)
  
    const handleEdit = () => {
      setIsEditing(true)
    }
  
    const handleSave = () => {
      onSave(currentNote)
      setIsEditing(false)
    }
  
    const handleChange = (e) => {
      setCurrentNote(e.target.value)
    }
  
    return (
      <Box p={2}>
        {isEditing ? (
          <Box>
            <TextField multiline value={currentNote} onChange={handleChange} />
            <Box p={1} />
            <Button variant="contained" onClick={handleSave}>
              Save
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography>{currentNote}</Typography>
            <Divider />
            {details.date && details.person && (
              <Typography variant="caption">
                {details.date && fDateTime(details.date)} {details.person ? `by ${details.person}` : null}
              </Typography>
            )}
            <Box p={1} />
            <Button variant="contained" onClick={handleEdit}>
              Edit
            </Button>
          </Box>
        )}
      </Box>
    )
  }
  
  const getStatusLabel = (row) => {
    const analyzeStatus = row?.analyses?.status ? row.analyses.status : null
    const annotationStatus = row?.annotations?.status ? row.annotations.status : null
    const is_annotated = row?.is_annotated
    if (!is_annotated) return 'WAITING'
    // if we're finished with annotating, return analysis status
    if (!annotationStatus || annotationStatus === 'DONE') return analyzeStatus
    return 'ANNO_' + annotationStatus
  }
  
  const DeleteFileButton = ({ onClickConfirm }) => {
    const [dialogOpen, setDialogOpen] = useState(false)
  
    const handleClickDelete = () => {
      setDialogOpen(true)
    }
  
    const handleCloseDialog = () => {
      setDialogOpen(false)
    }
  
    const handleClickConfirm = () => {
      setDialogOpen(false)
      onClickConfirm()
    }
  
    return (
      <>
        <IconButton sx={{ '&:hover': { color: 'error.main' } }} onClick={handleClickDelete}>
          <DeleteIcon />
        </IconButton>
        <Dialog open={dialogOpen} onClose={handleCloseDialog}>
          <DialogTitle>Danger: Delete file</DialogTitle>
          <Box p={0.5} />
          <DialogContent>
            <DialogContentText>Do you really want to delete this file?</DialogContentText>
            <DialogContentText>This will delete the file and all associated analyses.</DialogContentText>
            <DialogContentText>
              <strong>This action cannot be undone.</strong>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleClickConfirm} autoFocus color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </>
    )
  }
  
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px #000',
    boxShadow: 24,
    borderRadius: '16px',
    p: 4,
  };
  
  const StatusButton = ({ fileName, status }) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
  
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
  
    if (status === 'ANALYSIS_DONE') {
      return (
        <Button variant="contained" onClick={() => navigate(`/priovar/sample/${fileName}`)} size="small">
          <ArrowForward sx={{ marginRight: '8px' }}  /> View
        </Button>
      );
    } else if (status === 'ANALYSIS_IN_PROGRESS') {
      return (
        <Button variant="contained" disabled size="small">
          <CircularProgress size={14} sx={{ marginRight: '8px' }} /> Running
        </Button>
      );
    } else if (status === 'FILE_ANNOTATED') {
      return (
        <>
          <Button variant="contained" onClick={handleOpen} size="small">
            <WarningIcon sx={{ marginRight: '8px' }} /> Analysis Not Started
          </Button>
        </>
      );
    } else {
      return null; // For other statuses, return nothing or adjust as needed
    }
  };
  
  const RequestedPatientsTable = function () {
    let navigate = useNavigate()
    const [data, setData] = useState([])
    const [medicalCenterName, setMedicalCenterName] = useState('');
    const [isLoading, setIsLoading] = useState(true)
    const [isAnnotationModalOpen, setAnnotationModalOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [isPatientDeleted, setIsPatientDeleted] = useState(false)
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await fetchRequestedMedicalCenterPatients()
        setData(data)
      } catch (error) {
        console.error('Error fetching clinician files:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const addNewNote = (vcfFileId, note) => {
      updateFileNotes(vcfFileId, note).then(() => {
        fetchData();
      })
    }

    const fetchMedicalCenterName = async () => {
        const medicalCenterId = localStorage.getItem('healthCenterId');
        if (medicalCenterId) {
            try {
                const response = await axios.get(`${ROOTS_PrioVar}/medicalCenter/${medicalCenterId}`);
                setMedicalCenterName(response.data.name); // Assuming the response contains an object with a name property
            } catch (error) {
                console.error('Failed to fetch medical center name:', error);
            }
        }
    };

    useEffect(() => {
      fetchMedicalCenterName();
      fetchData();
    }, [])

    useEffect(() => {
      if (isPatientDeleted) {
        fetchData();
      }
    }, [isPatientDeleted]);

    const setFinishedInfo = (row) => {
      const id = row.vcf_id ? row.vcf_id : row.fastq_pair_id
      updateFinishInfo(id).then(() => {
      })
    }

    const handleButtonChange = () => {
      //do the change here
      const { id, type } = selectedFile?.vcf_id
      ? { id: selectedFile.vcf_id, type: 'VCF' }
      : { id: selectedFile.fastq_pair_id, type: 'FASTQ' }
      let annotation = {
          type: 'Exome',
          machine: 'Illumina',
          kit: 0,
          panel: '',
          germline: true,
          alignment: 'BWA',
          reference: 'GRCh38',
          isSnp: false,
          isCnv: false,
          cnvAnalysis: 'xhmm+decont',
      }
      annotateFile(id, annotation, type).then((res) => {
      })
    }

    const handleSeeSimilarPatients = (row) => {
        localStorage.setItem('patientId', row.patientId);
        localStorage.setItem('patientName', row.patientName);
        navigate(PATH_DASHBOARD.general.similarPatients, { state: { detail: row } });
    }

    const handleDetails = (row) => {
        // TODO
    }
  
    const COLUMNS = [
      {
        name: 'created_at',
        label: 'Uploaded At',
        options: {
          filter: false,
          sort: true,
          customBodyRenderLite(dataIndex) {
            const row = data[dataIndex]
            return row && row.file ? fDateTime(row.file.createdAt) : null;

          },
        },
      },
      {
        name: 'completed_at',
        label: 'Completed At',
        options: {
          filter: false,
          sort: true,
          customBodyRenderLite(dataIndex) {
            const row = data[dataIndex]
            return row && row.file && row.file.finishedAt? fDateTime(row.file.finishedAt) : <>Not Finished</>;
  
          },
        },
      },
      /*
      {
        name: 'finished_at',
        label: 'Completed',
        options: {
          filter: true,
          sort: false,
          customBodyRenderLite(dataIndex) {
            const row = data[dataIndex]
            return row ? (
              <AnalysedCheckbox
                checked={row.file?.finishedAt != null}
                onChange={(e) => setFinishedInfo(row)}
                details={{ date: row.finish_time, person: row.finish_person }}
              />
            ) : null
          },
        },
      },
      */
      {
        name: 'patientName',
        label: 'Patient Name',
        options: {
          filter: true,
          sort: true,
          customBodyRenderLite: (dataIndex) => {
            const row = data[dataIndex]
            if (!row) return null
            return <Chip label={row.patientName} />
          },
        },
      },
      {
        name: 'clinicianName',
        label: 'Clinician Name',
        options: {
          filter: true,
          sort: true,
          customBodyRenderLite: (dataIndex) => {
            const row = data[dataIndex]
            if (!row) return null
            if (!row.file) return null
            return <Chip label={row.file.clinicianName} />
          },
        },
      },
      {
        name: 'clinicianComments',
        label: 'Clinician Comments',
        options: {
          filter: false,
          sort: false,
          customBodyRenderLite(dataIndex) {
            const row = data[dataIndex];
            if (!row.file) return null;
            const clinicianComments = row ? row.file.clinicianComments : null;
      
            return row ? (
              <ExpandOnClick
                expanded={
                  <div>
                    {clinicianComments.map((comment, index) => (
                        <p>{row.file.clinicianName + ": " + comment}</p>
                    ))}
                    <EditableNote
                        onSave={(notes) => addNewNote(row.file.vcfFileId, notes)}
                        details={{ person: row.file.clinicianName }}
                    />
                  </div>
                }
              >
                {({ ref, onClick }) => (
                  <IconButton variant="contained" ref={ref} onClick={onClick}>
                    <Note />
                  </IconButton>
                )}
              </ExpandOnClick>
            ) : null;
          },
        },
      },
      {
        name: 'status',
        label: 'Status',
        options: {
          filter: false,
          sort: true,
          customBodyRenderLite: (dataIndex) => {
            const row = data[dataIndex]
            const status = row.file.fileStatus
            console.log(status === 'FILE_ANNOTATED')
            //return status ? <JobStateStatus status={status} /> : null
            if (status === 'FILE_WAITING') {
              return <Label color='error' > File Not Found </Label>
            }
            else if (status === 'FILE_ANNOTATED') {
              return <Label color='secondary'> Analysis Waiting </Label>
            }
            else if (status === 'ANALYSIS_IN_PROGRESS') {
              return <Label color='warning' > Analysis Running </Label>
            }
            else if (status === 'ANALYSIS_DONE') {
              return <Label color='success' > Analysis Done </Label>
            }
            else {
              return <Chip label="..." />
            }
          },
        },
      },
      {
        name: 'details',
        label: 'Patient Details',
        options: {
          filter: false,
          sort: true,
          customBodyRenderLite(dataIndex) {
            const row = data[dataIndex];
            const patientDetailPath = PATH_DASHBOARD.general.patientDetailsConst.replace(':patientId', row.patientId).replace(':fileId', row.file.vcfFileId);
      
            return (
              <Button variant="contained" color="info" onClick={() => handleDetails(row)} 
                      component={RouterLink} to={patientDetailPath} size="small">
                <Info />
              </Button>
            );
          },
        },
      },
      {
        name: 'go',
        label: 'Analysis',
        options: {
          filter: false,
          sort: false,
          customBodyRenderLite: (dataIndex) => {
            const row = data[dataIndex]
            const status = row.file.fileStatus;
            return <StatusButton fileName={row.file.fileName} status={status} />;
          },
        },
      },
    ]
    
    return (
      <>
        { isLoading ? 
          (<CircularProgress />) : 
          (
            <>
            <Box display="flex" justifyContent="flex-end" mt={2} mb={0.5} mr={0.5}> 
            </Box>
            <VariantDasboard2
            open={isAnnotationModalOpen}
            handleButtonChange = {handleButtonChange}
            onClose={() => setAnnotationModalOpen()}
            />
            <MUIDataTable
              title={`Cross-Clinic Accessed Patients by ${medicalCenterName || '...'} Health Center`}
              data={data}
              columns={COLUMNS}
              options={{
                selectableRows: 'none',
                sortOrder: { name: 'created_at', direction: 'desc' },
                expandableRows: false,
                print: false,
                viewColumns: true,
                download: false,
              }}
            />
          </>
          )
        }
      </>
    )
  }
  
  export default RequestedPatientsTable
  
/*
switch (status) {
      case 'success':
        return (
          <>
            <Box display="flex" justifyContent="flex-end" mt={2}> 
            <Button 
                variant="contained" 
                color="info" 
                component={RouterLink} to={PATH_DASHBOARD.general.files}
                size="small"
            >
                <Add /> 
                Add Patient 
            </Button>
            </Box>
            <VariantDasboard2
            open={isAnnotationModalOpen}
            handleButtonChange = {handleButtonChange}
            onClose={() => setAnnotationModalOpen()}
            />
            <MUIDataTable
              title="All patients of clinic ABC"
              data={data}
              columns={COLUMNS}
              options={{
                selectableRows: 'none',
                sortOrder: { name: 'created_at', direction: 'desc' },
                expandableRows: false,
                print: false,
                viewColumns: true,
                download: false,
              }}
            />
          </>
        )
      default:
        return <CircularProgress />
    }
    */