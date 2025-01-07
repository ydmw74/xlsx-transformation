import React, { useState } from 'react'
    import * as XLSX from 'xlsx'
    import './index.css'

    function App() {
      const [file, setFile] = useState(null)
      const [sheets, setSheets] = useState([])
      const [selectedSheet, setSelectedSheet] = useState('')
      const [idField, setIdField] = useState('')
      const [amountField, setAmountField] = useState('')
      const [descriptionField, setDescriptionField] = useState('')
      const [columns, setColumns] = useState([])
      const [transformedData, setTransformedData] = useState(null)

      const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          setSheets(workbook.SheetNames)
          setFile(workbook)
        }
        reader.readAsArrayBuffer(file)
      }

      const handleSheetSelect = (sheetName) => {
        setSelectedSheet(sheetName)
        const worksheet = file.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        setColumns(json[0])
      }

      const transformData = () => {
        if (!file || !selectedSheet || !idField || !amountField || !descriptionField) return

        const worksheet = file.Sheets[selectedSheet]
        const json = XLSX.utils.sheet_to_json(worksheet)

        // Group data by member
        const groupedData = json.reduce((acc, row) => {
          const memberId = row[idField]
          if (!acc[memberId]) {
            acc[memberId] = {
              ...row,
              components: {}
            }
          }
          const component = row[descriptionField]
          acc[memberId].components[component] = (acc[memberId].components[component] || 0) + parseFloat(row[amountField])
          return acc
        }, {})

        // Create new structure
        const components = [...new Set(json.map(row => row[descriptionField]))]
        const transformed = Object.values(groupedData).map(member => {
          const newRow = { ...member }
          delete newRow.components
          components.forEach(comp => {
            newRow[comp] = member.components[comp] || 0
          })
          newRow.Gesamtbetrag = components.reduce((sum, comp) => sum + (newRow[comp] || 0), 0)
          return newRow
        })

        setTransformedData({
          data: transformed,
          columns: [idField, ...components, 'Gesamtbetrag']
        })
      }

      const downloadTransformedData = () => {
        if (!transformedData) return

        const worksheet = XLSX.utils.json_to_sheet(transformedData.data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transformierte Daten')
        XLSX.writeFile(workbook, 'transformierte_daten.xlsx')
      }

      return (
        <div>
          <h1>Excel Daten Transformation</h1>
          
          <div className="upload-section">
            <input type="file" accept=".xlsx" onChange={handleFileUpload} />
          </div>

          {sheets.length > 0 && (
            <div className="controls">
              <label>
                Sheet auswählen:
                <select value={selectedSheet} onChange={(e) => handleSheetSelect(e.target.value)}>
                  <option value="">Bitte wählen</option>
                  {sheets.map(sheet => (
                    <option key={sheet} value={sheet}>{sheet}</option>
                  ))}
                </select>
              </label>

              {columns.length > 0 && (
                <>
                  <label>
                    Mitglieder-ID Feld:
                    <select value={idField} onChange={(e) => setIdField(e.target.value)}>
                      <option value="">Bitte wählen</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Betrag Feld:
                    <select value={amountField} onChange={(e) => setAmountField(e.target.value)}>
                      <option value="">Bitte wählen</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Bezeichnung Feld:
                    <select value={descriptionField} onChange={(e) => setDescriptionField(e.target.value)}>
                      <option value="">Bitte wählen</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </label>

                  <button onClick={transformData}>Daten transformieren</button>
                </>
              )}
            </div>
          )}

          {transformedData && (
            <div>
              <h2>Transformierte Daten</h2>
              <button onClick={downloadTransformedData}>Download Excel</button>
              <table>
                <thead>
                  <tr>
                    {transformedData.columns.map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transformedData.data.map((row, i) => (
                    <tr key={i}>
                      {transformedData.columns.map(col => (
                        <td key={col}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }

    export default App
