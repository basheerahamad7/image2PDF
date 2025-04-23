// App.jsx
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import jsPDF from 'jspdf';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import getCroppedImg from './utils/cropImage';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("enter PDF name");

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({ id: URL.createObjectURL(file), file }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const showCropper = (image) => {
    setCurrentImage(image);
    setIsCropping(true);
  };

  const saveCroppedImage = async () => {
    try {
      const croppedUrl = await getCroppedImg(currentImage.id, croppedAreaPixels);
      setImages((prev) =>
        prev.map((img) => (img.id === currentImage.id ? { ...img, cropped: croppedUrl } : img))
      );
      setIsCropping(false);
    } catch (e) {
      console.error(e);
    }
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
    let loadedCount = 0;

    images.forEach((img, index) => {
      const image = new Image();
      image.src = img.cropped || img.id;
      image.onload = () => {
        const width = pdf.internal.pageSize.getWidth();
        const height = (image.height * width) / image.width;
        if (index !== 0) pdf.addPage();
        pdf.addImage(image, 'JPEG', 0, 0, width, height);
        loadedCount++;
        if (loadedCount === images.length) {
          pdf.save(`${pdfFileName || 'images'}.pdf`);
        }
      };
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...images];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setImages(reordered);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Image to PDF App</h1>
      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="file-input" />

      <input
        type="text"
        placeholder="Enter PDF file name"
        value={pdfFileName}
        onChange={(e) => setPdfFileName(e.target.value)}
        className="file-name-input"
      />

      {isCropping && (
        <div className="cropper-overlay">
          <div className="cropper-container">
            <Cropper
              image={currentImage?.id}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
            <div className="cropper-controls">
              <button onClick={saveCroppedImage} className="btn btn-green">
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="images" direction="horizontal">
          {(provided) => (
            <div className="image-list" {...provided.droppableProps} ref={provided.innerRef}>
              {images.map((img, i) => (
                <Draggable key={img.id} draggableId={img.id} index={i}>
                  {(provided) => (
                    <div
                      className="image-box"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <img
                        src={img.cropped || img.id}
                        alt={`img-${i}`}
                        className="image-preview"
                      />
                      <button onClick={() => showCropper(img)} className="crop-btn">
                        Crop
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button onClick={generatePDF} className="btn btn-blue">
        Generate PDF
      </button>
    </div>
  );
}

export default App;