import React, { useState, useEffect } from "react";
import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import FolderIcon from '@material-ui/icons/Folder';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import CircularProgress from '@material-ui/core/CircularProgress';
import Box from '@material-ui/core/Box';
import { useDropzone } from 'react-dropzone';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    border: {
        border: '2px solid red'
    }
}));

const Upload = ({ disable, selectedTemplate, onUpload, allFilesStatus, currentFileStatus }) => {

    const [files, setfiles] = useState([]);

    const classes = useStyles();
    const { acceptedFiles, fileRejections, getRootProps, getInputProps } = useDropzone({
        accept: '.csv',
        onDrop: files => setfiles(files)
    });

    const getFileUploadStatus = name => {
        let progress = currentFileStatus[name] ? currentFileStatus[name]['progress'] : allFilesStatus[name]['progress'];
        return progress;
    }

    return (
        <div className={classes.root}>
            <Grid border={1} container spacing={3}>
                <Grid item xs={6}>
                    <div className={classes.border}
                        {...getRootProps({ className: 'dropzone disabled' })}>
                        <input {...getInputProps()} />
                        <p>Drag 'n' drop some files here, or click to select files {selectedTemplate ? ` for ${selectedTemplate}` : ''}</p>
                    </div>
                </Grid>

                <Grid item xs={3}>
                    <Button
                        variant="contained"
                        color="default"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => onUpload(files)}
                        disabled={disable || ((acceptedFiles && acceptedFiles.length) ? false : true)}
                    >
                        Upload
                    </Button>
                </Grid>
            </Grid>

            {
                (acceptedFiles && acceptedFiles.length) ?

                    (<Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" className={classes.title}>
                                Accepted Files
                            </Typography>
                            <div className={classes.demo}>
                                <List dense={true}>
                                    {
                                        acceptedFiles.map(file => (
                                            <ListItem key={file.path}>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <FolderIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={file.path}
                                                    secondary={file.size + ' bytes'}
                                                />

                                                {
                                                    (allFilesStatus[file.path]) &&
                                                    (<ListItemSecondaryAction>
                                                        <Box position="relative" display="inline-flex">
                                                            <CircularProgress
                                                                variant="determinate"
                                                                value={getFileUploadStatus(file.path)}
                                                            />
                                                            <Box
                                                                top={0}
                                                                left={0}
                                                                bottom={0}
                                                                right={0}
                                                                position="absolute"
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                            >
                                                                <Typography variant="caption" component="div" color="textSecondary">
                                                                    {getFileUploadStatus(file.path)}%

                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </ListItemSecondaryAction>
                                                    )

                                                }


                                            </ListItem>
                                        ))
                                    }


                                </List>
                            </div>
                        </Grid>
                    </Grid>)
                    :
                    ''
            }

            {
                (fileRejections && fileRejections.length) ?

                    (<Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" className={classes.title}>
                                Rejected Files
                            </Typography>
                            <div className={classes.demo}>
                                <List dense={true}>
                                    {
                                        fileRejections.map(({ file, errors }) => (
                                            <ListItem key={file.path}>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <FolderIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={file.path}
                                                    secondary={JSON.stringify(errors)}
                                                />
                                            </ListItem>
                                        ))
                                    }


                                </List>
                            </div>
                        </Grid>
                    </Grid>)
                    :
                    ''
            }
        </div >

    )
}

export default Upload;
