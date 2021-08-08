import React, { Fragment, useState, useEffect } from 'react';
import GridTable from './GridTable';
import Upload from './Upload';
import Storage from "@aws-amplify/storage";
import { API } from 'aws-amplify';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import TemplateSelector from './TemplateSelector';

import Grid from '@material-ui/core/Grid';
import CenteredLoader from './CenteredLoader';
import toast, { Toaster } from 'react-hot-toast';

const { uuid } = require('uuidv4');

const columns = [

  {
    field: "template", headerName: "Template", flex: 1,
    minWidth: 150,
  },
  {
    field: "batchId", headerName: "Batch Id", flex: 1,
    minWidth: 150,
  },
  {
    field: "uploadStatus", headerName: "Upload Status", flex: 1,
    minWidth: 150,
  },
  {
    field: "files", headerName: "Files", flex: 1,
    minWidth: 150,
  },
  {
    field: "createdBy", headerName: "created By", flex: 1,
    minWidth: 150,
  },
  {
    field: "createdAt", headerName: "Created At", flex: 1,
    minWidth: 150,
  },

]

const Reports = ({ user }) => {
  let [allFilesStatus, setAllFilesStatus] = useState({});
  let [currentFileStatus, setCurrentFileStatus] = useState({});
  let [selectedTemplate, setSelectedTemplate] = useState('');
  let [currentBatchId, setCurrentBatchId] = useState();

  let [rows, setRows] = useState([]);
  let [templates, setTemplates] = useState([]);

  const handleTemplatechange = (value) => {
    setSelectedTemplate(value);
  }

  const getTemplates = async () => {
    try {
      let { data } = await API.graphql({ query: queries.listManualDataIngestionTemplates })

      setTemplates(data.listManualDataIngestionTemplates.items.map(item => item.name))
    }
    catch (error) {
      console.error(error)
    }
  }


  const getUploads = async () => {
    try {
      let { data } = await API.graphql({ query: queries.listManualDataIngestionUploads })
      console.log(data)
      setRows(data.listManualDataIngestionUploads.items)
    }
    catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getUploads();
    getTemplates();
  }, [])


  const uploadFile = async (file, path, batchId) => {
    return await Storage.put(file.name,
      file,
      {
        contentType: file.type,
        customPrefix: {
          public: `${path}/${batchId}/`
        },
        progressCallback(progress) {
          setCurrentFileStatus({
            [file.name]: {
              progress: Math.round((progress.loaded / progress.total) * 100)
            }
          })
        }
      })
  };

  const handleUpload = async (files) => {
    let batchId = uuid();

    const toastId = toast.loading(`File upload batch id - ${batchId} in progress, please do not close the browser`);

    setCurrentBatchId(batchId);

    let uploadStatus = {}
    let fileNames = []
    files.forEach(file => {
      uploadStatus[file.name] = { progress: 0, error: null }
      fileNames.push(file.name)
    })

    setAllFilesStatus(uploadStatus)

    for (const file of files) {
      try {
        await uploadFile(file, selectedTemplate, batchId)

        uploadStatus = {
          ...uploadStatus,
          [file.name]: { progress: 100 }
        }
        setAllFilesStatus(uploadStatus)
      }
      catch (error) {
        console.error(error)
        toast(`Failed to upload file ${file.name}`);
        uploadStatus = {
          ...uploadStatus,
          [file.name]: { error }
        }
        setAllFilesStatus(uploadStatus)

      }
    }

    const uploadDetails = {
      "batchId": batchId,
      "createdAt": new Date(),
      "createdBy": user.signInUserSession.idToken.payload.email,
      "files": JSON.stringify(fileNames),
      "id": batchId,
      "lastUpdatedAt": new Date(),
      "template": selectedTemplate,
      "uploadStatus": "UPLOADED"
    }

    const createResult = await API.graphql({ query: mutations.createManualDataIngestionUpload, variables: { input: uploadDetails } });

    const trigger = await API.graphql({ query:queries.triggerFileValidation, variables: { batchId: batchId } });

    console.log(trigger)

    setRows([...rows, createResult.data.createManualDataIngestionUpload])

    toast.dismiss(toastId);

    toast.success(`All files have been successfully uploaded`);
    setCurrentBatchId('');
  };

  return (
    <Fragment>

      {
        rows.length ?
          <Fragment>
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <TemplateSelector disable={currentBatchId ? true : false} templates={templates} value={selectedTemplate} onTemplateChange={handleTemplatechange} />
              </Grid>
            </Grid>

            {
              selectedTemplate && (
                <Fragment>
                  <br /><br />
                  <Upload
                    disable={currentBatchId ? true : false}
                    selectedTemplate={selectedTemplate}
                    onUpload={handleUpload}
                    currentFileStatus={currentFileStatus}
                    allFilesStatus={allFilesStatus}
                  />
                </Fragment>
              )
            }

            <br /><br />
            <div style={{ height: 400, width: '100%' }}>
              <GridTable rows={rows} columns={columns} getRowId={(row) => row.batchId} defaultSortby='createdAt' />
            </div>
          </Fragment>
          :
          <CenteredLoader />

      }

      <Toaster />

    </Fragment>

  );
}

export default Reports;
