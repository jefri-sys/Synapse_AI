import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  X, UploadCloud, Download, Trash2, Loader2, MoreVertical, LayoutGrid, List, ArrowLeft, FolderPlus, Edit2, CornerUpRight,
  Maximize, Minimize, ZoomIn, ZoomOut, Music
} from 'lucide-react';
import { 
  AiFillFilePdf, AiFillVideoCamera, AiFillFileWord, 
  AiFillFileExcel, AiFillFilePpt, AiFillFileZip, AiFillFile, AiFillPicture, AiFillFolder 
} from 'react-icons/ai';
import { subjectFileService } from '../../services/subjectFileService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function SubjectDrawer({ subject, isOpen, onClose }) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [previewFile, setPreviewFile] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  
  // Preview Modal States
  const [imageZoom, setImageZoom] = useState(false);
  const [docsError, setDocsError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [docsTimer, setDocsTimer] = useState(null);
  
  // Navigation
  const [folderStack, setFolderStack] = useState([]);
  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1]._id : null;

  // Inline Creation / Rename
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('New Folder');
  const [renamingItem, setRenamingItem] = useState(null); // { id, type: 'folder' | 'file', currentName }
  const createInputRef = useRef(null);

  // Drag and Drop State
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  // Move Modal State
  const [moveItem, setMoveItem] = useState(null); // { id, type: 'folder' | 'file', name }
  const [allFolders, setAllFolders] = useState([]); // For move modal tree
  const [loadingMoveTree, setLoadingMoveTree] = useState(false);

  useEffect(() => {
    if (isOpen && subject) {
      loadContents();
    }
  }, [isOpen, subject, currentFolderId]);

  useEffect(() => {
    if (previewFile) {
      setImageZoom(false);
      setDocsError(false);
      
      const type = previewFile.fileType || '';
      if (type.includes('word') || type.includes('document') || type.includes('excel') || type.includes('spreadsheet') || type.includes('powerpoint') || type.includes('presentation')) {
        const timer = setTimeout(() => {
          setDocsError(true);
        }, 10000);
        setDocsTimer(timer);
        return () => clearTimeout(timer);
      }
    }
  }, [previewFile]);

  const handleDocsLoad = () => {
    if (docsTimer) {
      clearTimeout(docsTimer);
      setDocsTimer(null);
    }
  };

  const loadContents = async () => {
    try {
      setLoading(true);
      const data = await subjectFileService.getContents(subject._id, currentFolderId);
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (err) {
      console.error('Failed to load contents', err);
    } finally {
      setLoading(false);
    }
  };

  const onDropFiles = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      const fileName = file.name;
      setUploadingFiles(prev => ({ ...prev, [fileName]: 0 }));
      
      try {
        await subjectFileService.uploadFile(subject._id, file, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadingFiles(prev => ({ ...prev, [fileName]: percentCompleted }));
        }, currentFolderId);
        await loadContents();
      } catch (err) {
        console.error('Upload failed for', fileName, err);
        alert(`Failed to upload ${fileName}`);
      } finally {
        setUploadingFiles(prev => {
          const next = { ...prev };
          delete next[fileName];
          return next;
        });
      }
    }
  }, [subject, currentFolderId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: onDropFiles, noClick: true });
  const { getRootProps: getCompactRootProps, getInputProps: getCompactInputProps } = useDropzone({ onDrop: onDropFiles });

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      setCreatingFolder(false);
      return;
    }
    try {
      await subjectFileService.createFolder(subject._id, newFolderName.trim(), currentFolderId);
      setCreatingFolder(false);
      setNewFolderName('New Folder');
      loadContents();
    } catch (err) {
      console.error('Create folder failed', err);
      alert('Failed to create folder');
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renamingItem || !renamingItem.currentName.trim()) {
      setRenamingItem(null);
      return;
    }
    try {
      if (renamingItem.type === 'folder') {
        await subjectFileService.renameFolder(subject._id, renamingItem.id, renamingItem.currentName.trim());
      } else {
        await subjectFileService.renameFile(subject._id, renamingItem.id, renamingItem.currentName.trim());
      }
      setRenamingItem(null);
      loadContents();
    } catch (err) {
      console.error('Rename failed', err);
      alert('Failed to rename');
    }
  };

  const handleDelete = async (id, type) => {
    const isFolder = type === 'folder';
    const msg = isFolder 
      ? 'This will delete all files and subfolders inside. Are you sure?'
      : 'Are you sure you want to delete this file?';
      
    if (!window.confirm(msg)) return;
    
    try {
      if (isFolder) {
        await subjectFileService.deleteFolder(subject._id, id);
      } else {
        await subjectFileService.deleteFile(subject._id, id);
        if (previewFile?._id === id) setPreviewFile(null);
      }
      setContextMenu(null);
      loadContents();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete');
    }
  };

  const openMoveModal = async (item, type) => {
    setContextMenu(null);
    setMoveItem({ id: item._id, type, name: item.name || item.originalName });
    setLoadingMoveTree(true);
    try {
      const data = await subjectFileService.getAllFolders(subject._id);
      setAllFolders(data.folders || []);
    } catch (err) {
      console.error('Failed to load folders for move', err);
    } finally {
      setLoadingMoveTree(false);
    }
  };

  const handleMove = async (targetFolderId) => {
    try {
      if (moveItem.type === 'folder') {
        await subjectFileService.moveFolder(subject._id, moveItem.id, targetFolderId);
      } else {
        await subjectFileService.moveFile(subject._id, moveItem.id, targetFolderId);
      }
      setMoveItem(null);
      loadContents();
    } catch (err) {
      console.error('Move failed', err);
      alert(err.response?.data?.message || 'Failed to move item');
    }
  };

  // Drag and drop within the grid
  const handleDragStart = (e, item, type) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item._id, type }));
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    if (dragOverFolderId !== folderId) setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    setDragOverFolderId(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.id === targetFolderId) return; // Can't drop into itself
      
      if (data.type === 'folder') {
        await subjectFileService.moveFolder(subject._id, data.id, targetFolderId);
      } else {
        await subjectFileService.moveFile(subject._id, data.id, targetFolderId);
      }
      loadContents();
    } catch (err) {
      console.error('Drag drop failed', err);
    }
  };

  // Helpers
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file) => {
    const type = file.fileType || '';
    if (type.includes('pdf')) return <AiFillFilePdf className="w-[72px] h-[72px] text-status-danger drop-shadow-sm" />;
    if (type.includes('video')) return <AiFillVideoCamera className="w-[72px] h-[72px] text-status-info drop-shadow-sm" />;
    if (type.includes('word') || type.includes('document')) return <AiFillFileWord className="w-[72px] h-[72px] text-brand-primary drop-shadow-sm" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <AiFillFileExcel className="w-[72px] h-[72px] text-status-success drop-shadow-sm" />;
    if (type.includes('powerpoint') || type.includes('presentation')) return <AiFillFilePpt className="w-[72px] h-[72px] text-status-warning drop-shadow-sm" />;
    if (type.includes('zip') || type.includes('compressed') || type.includes('rar')) return <AiFillFileZip className="w-[72px] h-[72px] text-status-warning drop-shadow-sm" />;
    return <AiFillFile className="w-[72px] h-[72px] text-text-tertiary drop-shadow-sm" />;
  };

  const getSmallIcon = (type) => {
    if (!type) return <AiFillFile className="w-5 h-5 text-text-tertiary" />;
    if (type.includes('pdf')) return <AiFillFilePdf className="w-5 h-5 text-status-danger" />;
    if (type.includes('image')) return <AiFillPicture className="w-5 h-5 text-brand-primary" />;
    if (type.includes('video')) return <AiFillVideoCamera className="w-5 h-5 text-status-info" />;
    if (type.includes('word') || type.includes('document')) return <AiFillFileWord className="w-5 h-5 text-brand-primary" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <AiFillFileExcel className="w-5 h-5 text-status-success" />;
    if (type.includes('powerpoint') || type.includes('presentation')) return <AiFillFilePpt className="w-5 h-5 text-status-warning" />;
    if (type.includes('zip') || type.includes('compressed') || type.includes('rar')) return <AiFillFileZip className="w-5 h-5 text-status-warning" />;
    return <AiFillFile className="w-5 h-5 text-text-tertiary" />;
  };

  const renderPreviewContent = () => {
    if (!previewFile) return null;
    const type = previewFile.fileType || '';
    let url = previewFile.fileUrl;

    if (type.includes('pdf')) {
      return (
        <iframe 
          src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`} 
          className="w-full h-full border-0" 
          title={previewFile.originalName}
        />
      );
    }
    
    if (type.includes('image')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center p-4 bg-surface-sunken">
          <img 
            src={url} 
            alt={previewFile.originalName} 
            className={`transition-all duration-300 cursor-pointer ${imageZoom ? 'w-full h-full object-cover' : 'max-w-full max-h-[90%] object-contain'}`}
            onClick={() => setImageZoom(!imageZoom)}
          />
          <button 
            onClick={() => setImageZoom(!imageZoom)}
            className="absolute bottom-6 right-6 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors"
          >
            {imageZoom ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
        </div>
      );
    }

    if (type.includes('video')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-surface-sunken">
          <video controls src={url} className="w-full max-h-[80vh] outline-none" />
        </div>
      );
    }

    if (type.includes('audio')) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-surface-sunken p-8">
          <div className="w-32 h-32 bg-surface-sunken rounded-full flex items-center justify-center mb-8 shadow-xl">
            <Music className="w-16 h-16 text-brand-primary" />
          </div>
          <audio controls src={url} className="w-full max-w-md outline-none" />
          <p className="mt-6 text-text-tertiary font-medium">{previewFile.originalName}</p>
        </div>
      );
    }

    if (type.includes('word') || type.includes('document') || type.includes('excel') || type.includes('spreadsheet') || type.includes('powerpoint') || type.includes('presentation')) {
      return (
        <div className="w-full h-full flex flex-col relative bg-surface-base">
          <div className="bg-surface-raised text-text-secondary text-xs py-2 px-4 text-center border-b border-surface-border">
            Powered by Google Docs Viewer — large files may take a moment to load
          </div>
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
            className="flex-1 w-full border-0"
            title={previewFile.originalName}
            onLoad={handleDocsLoad}
          />
          {docsError && (
            <div className="absolute inset-0 bg-surface-base/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-10 text-center">
              <AiFillFile className="w-16 h-16 text-text-tertiary mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-6">Preview unavailable — click to download</h3>
              <a href={url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-brand-primary hover:bg-brand-primary text-white font-medium rounded-lg shadow-md transition-colors flex items-center gap-2">
                <Download className="w-5 h-5" /> Download {previewFile.originalName}
              </a>
            </div>
          )}
        </div>
      );
    }
    
    // Unsupported
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-surface-sunken text-center">
        <AiFillFile className="w-24 h-24 text-text-primary mb-6" />
        <h3 className="text-xl font-semibold text-text-tertiary mb-8">This file type cannot be previewed</h3>
        <a href={url} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-brand-primary hover:bg-brand-primary text-white font-medium rounded-xl shadow-lg transition-colors flex items-center gap-3">
          <Download className="w-5 h-5" /> Download File
        </a>
      </div>
    );
  };

  // Render Move Modal Tree
  const renderFolderTree = (parentId, depth = 0) => {
    const children = allFolders.filter(f => (f.parentFolderId || null) === (parentId || null));
    if (children.length === 0) return null;

    return children.map(folder => {
      if (moveItem.type === 'folder' && folder._id === moveItem.id) return null; // Can't move into itself
      return (
        <div key={folder._id} className="w-full">
          <button
            onClick={() => handleMove(folder._id)}
            className="w-full text-left py-1.5 px-2 hover:bg-brand-primary-subtle rounded flex items-center gap-2 text-sm text-text-primary group transition-colors"
            style={{ paddingLeft: `${(depth * 1.5) + 0.5}rem` }}
          >
            <AiFillFolder className="w-4 h-4 text-status-warning group-hover:text-status-warning" />
            {folder.name}
          </button>
          {renderFolderTree(folder._id, depth + 1)}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex" {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="fixed inset-0 bg-surface-sunken/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        {/* Full Screen Modal */}
        <div 
          className="relative w-full bg-surface-base h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden"
          onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}
        >
          {isDragActive && (
            <div className="absolute inset-0 z-10 bg-brand-primary/10 border-4 border-brand-primary border-dashed m-4 rounded-2xl flex items-center justify-center backdrop-blur-sm pointer-events-none">
              <Card className="p-6 flex flex-col items-center shadow-xl border-none">
                <UploadCloud className="w-12 h-12 text-brand-primary mb-3" />
                <p className="text-lg font-bold text-text-primary">Drop files to upload</p>
              </Card>
            </div>
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b border-surface-border flex justify-between items-center bg-surface-base z-20 shadow-sm shrink-0">
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">{subject?.code} File Explorer</h2>
              <p className="text-sm font-medium text-text-secondary uppercase tracking-wide">{subject?.name}</p>
            </div>
            <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-secondary hover:bg-surface-raised rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="bg-surface-base border-b border-surface-border px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
            {folderStack.length > 0 && (
              <button 
                onClick={() => setFolderStack(prev => prev.slice(0, -1))}
                className="flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-text-primary mr-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button 
              onClick={() => setFolderStack([])}
              className={`text-sm hover:underline whitespace-nowrap transition-colors ${folderStack.length === 0 ? 'text-text-primary font-semibold' : 'text-brand-primary'}`}
            >
              {subject?.name}
            </button>
            {folderStack.map((folder, index) => (
              <React.Fragment key={folder._id}>
                <span className="text-text-tertiary text-sm">/</span>
                <button 
                  onClick={() => setFolderStack(folderStack.slice(0, index + 1))}
                  className={`text-sm hover:underline whitespace-nowrap transition-colors ${index === folderStack.length - 1 ? 'text-text-primary font-semibold' : 'text-brand-primary'}`}
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-raised/50">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-surface-base px-4 py-3 rounded-lg border border-surface-border shadow-sm shrink-0">
              <span className="text-sm font-medium text-text-secondary">
                {folders.length} {folders.length === 1 ? 'folder' : 'folders'}, {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    setCreatingFolder(true);
                    setTimeout(() => createInputRef.current?.focus(), 50);
                  }}
                  variant="outline"
                  className="gap-2 px-3 py-1.5 text-sm h-auto mr-2 shadow-sm"
                >
                  <FolderPlus className="w-4 h-4" /> New Folder
                </Button>
                <div {...getCompactRootProps()} className="cursor-pointer">
                  <input {...getCompactInputProps()} />
                  <Button variant="secondary" className="gap-2 px-3 py-1.5 text-sm h-auto mr-2 shadow-sm">
                    <UploadCloud className="w-4 h-4" /> Upload File
                  </Button>
                </div>
                <div className="flex bg-surface-raised p-1 rounded-lg">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface-base shadow-sm text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface-base shadow-sm text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadingFiles).length > 0 && (
              <div className="space-y-3 shrink-0">
                {Object.entries(uploadingFiles).map(([name, progress]) => (
                  <div key={name} className="bg-surface-base border border-brand-primary-subtle p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-medium text-text-primary truncate mr-4">{name}</span>
                      <span className="text-brand-primary font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-surface-raised rounded-full h-1.5"><div className="bg-brand-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Grid / List View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-primary" />
                <p className="text-sm">Loading contents...</p>
              </div>
            ) : folders.length > 0 || files.length > 0 || creatingFolder ? (
              viewMode === 'grid' ? (
                <div className="flex flex-wrap gap-2">
                  {/* Inline Create Folder */}
                  {creatingFolder && (
                    <div className="relative border border-transparent rounded p-2 flex flex-col items-center w-28 h-32">
                      <div className="mb-1 flex items-center justify-center h-[76px] w-full">
                        <AiFillFolder className="w-[72px] h-[72px] text-status-warning drop-shadow-sm" />
                      </div>
                      <form onSubmit={handleCreateFolder} className="w-full px-0.5">
                        <input
                          ref={createInputRef}
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onBlur={() => setCreatingFolder(false)}
                          onKeyDown={(e) => { if (e.key === 'Escape') setCreatingFolder(false); }}
                          className="w-full text-[12px] text-center border border-brand-primary rounded px-1 py-0.5 outline-none shadow-sm focus:ring-1 focus:ring-brand-primary"
                        />
                      </form>
                    </div>
                  )}

                  {/* Folders */}
                  {folders.map(folder => (
                    <div 
                      key={folder._id} 
                      draggable={renamingItem?.id !== folder._id}
                      onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                      onDragOver={(e) => handleDragOver(e, folder._id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folder._id)}
                      className={`relative border rounded p-2 transition-all cursor-pointer group flex flex-col items-center w-28 h-32
                        ${dragOverFolderId === folder._id ? 'bg-brand-primary-subtle border-brand-primary border-2' : 'border-transparent hover:bg-brand-primary-subtle/40 hover:border-brand-primary-subtle'}
                      `}
                      onClick={() => {
                        if (renamingItem?.id !== folder._id) {
                          setFolderStack([...folderStack, { _id: folder._id, name: folder.name }]);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, item: folder, type: 'folder' });
                      }}
                    >
                      <div className="mb-1 flex items-center justify-center h-[76px] w-full">
                        <AiFillFolder className="w-[72px] h-[72px] text-status-warning drop-shadow-sm" />
                      </div>
                      <div className="w-full px-0.5">
                        {renamingItem?.id === folder._id ? (
                          <form onSubmit={handleRename} onClick={e => e.stopPropagation()}>
                            <input
                              autoFocus
                              type="text"
                              value={renamingItem.currentName}
                              onChange={(e) => setRenamingItem({ ...renamingItem, currentName: e.target.value })}
                              onBlur={() => setRenamingItem(null)}
                              onKeyDown={(e) => { if (e.key === 'Escape') setRenamingItem(null); }}
                              className="w-full text-[12px] text-center border border-brand-primary rounded px-1 py-0.5 outline-none"
                            />
                          </form>
                        ) : (
                          <p className="text-[12px] text-text-primary text-center leading-snug line-clamp-2 w-full break-words group-hover:text-brand-primary-hover transition-colors">
                            {folder.name}
                          </p>
                        )}
                      </div>
                      <button 
                        className="absolute top-2 right-2 p-1 text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-border rounded transition-all"
                        onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: folder, type: 'folder' }); }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Files */}
                  {files.map(file => (
                    <div 
                      key={file._id} 
                      draggable={renamingItem?.id !== file._id}
                      onDragStart={(e) => handleDragStart(e, file, 'file')}
                      className="relative border border-transparent rounded p-2 hover:bg-brand-primary-subtle/40 hover:border-brand-primary-subtle transition-all cursor-pointer group flex flex-col items-center w-28 h-32"
                      onClick={() => { if (renamingItem?.id !== file._id) setPreviewFile(file); }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, item: file, type: 'file' });
                      }}
                    >
                      <div className="mb-1 flex items-center justify-center h-[76px] w-full">
                        {getFileIcon(file)}
                      </div>
                      <div className="w-full px-0.5">
                        {renamingItem?.id === file._id ? (
                          <form onSubmit={handleRename} onClick={e => e.stopPropagation()}>
                            <input
                              autoFocus
                              type="text"
                              value={renamingItem.currentName}
                              onChange={(e) => setRenamingItem({ ...renamingItem, currentName: e.target.value })}
                              onBlur={() => setRenamingItem(null)}
                              onKeyDown={(e) => { if (e.key === 'Escape') setRenamingItem(null); }}
                              className="w-full text-[12px] text-center border border-brand-primary rounded px-1 py-0.5 outline-none"
                            />
                          </form>
                        ) : (
                          <p className="text-[12px] text-text-primary text-center leading-snug line-clamp-2 w-full break-words group-hover:text-brand-primary-hover transition-colors" title={file.originalName}>
                            {file.originalName}
                          </p>
                        )}
                      </div>
                      <button 
                        className="absolute top-2 right-2 p-1 text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-border rounded transition-all"
                        onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: file, type: 'file' }); }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-0 overflow-hidden shadow-sm">
                  <div className="divide-y divide-gray-100">
                    {folders.map(folder => (
                      <div 
                        key={folder._id}
                        className="flex items-center gap-4 p-3 hover:bg-brand-primary-subtle cursor-pointer transition-colors group relative"
                        onClick={() => setFolderStack([...folderStack, { _id: folder._id, name: folder.name }])}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: folder, type: 'folder' }); }}
                      >
                        <div className="shrink-0 p-1.5 bg-surface-raised rounded-lg border border-surface-border">
                          <AiFillFolder className="w-5 h-5 text-status-warning" />
                        </div>
                        <div className="min-w-0 flex-1 flex items-center">
                          <h4 className="text-sm font-semibold text-text-primary truncate">{folder.name}</h4>
                        </div>
                        <button 
                          className="p-1.5 text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-border rounded transition-all shrink-0"
                          onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX - 100, y: e.clientY, item: folder, type: 'folder' }); }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {files.map(file => (
                      <div 
                        key={file._id}
                        className="flex items-center gap-4 p-3 hover:bg-brand-primary-subtle cursor-pointer transition-colors group relative"
                        onClick={() => setPreviewFile(file)}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: file, type: 'file' }); }}
                      >
                        <div className="shrink-0 p-1.5 bg-surface-raised rounded-lg border border-surface-border">
                          {getSmallIcon(file.fileType)}
                        </div>
                        <div className="min-w-0 flex-1 flex justify-between gap-4">
                          <h4 className="text-sm font-semibold text-text-primary truncate">{file.originalName}</h4>
                          <div className="flex items-center gap-4 text-xs text-text-tertiary whitespace-nowrap">
                            <span>{formatSize(file.fileSize)}</span>
                            <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button 
                          className="p-1.5 text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-border rounded transition-all shrink-0"
                          onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX - 100, y: e.clientY, item: file, type: 'file' }); }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            ) : (
              <div 
                {...getCompactRootProps()} 
                className="flex flex-col items-center justify-center py-20 px-4 bg-surface-base border border-surface-border border-dashed rounded-xl text-center shadow-sm cursor-pointer hover:border-brand-primary hover:bg-brand-primary-subtle/50 transition-colors"
              >
                <input {...getCompactInputProps()} />
                <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8 text-text-tertiary" />
                </div>
                <h4 className="text-base font-semibold text-text-primary">This folder is empty</h4>
                <p className="text-sm text-text-secondary mt-1 max-w-sm">Drag and drop files here, or click to upload</p>
              </div>
            )}
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div 
            className="fixed z-[10000] bg-surface-base border border-surface-border rounded-lg shadow-xl py-1 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ top: Math.min(contextMenu.y, window.innerHeight - 150), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-surface-border mb-1">
              <p className="text-xs font-semibold text-text-primary truncate">{contextMenu.item.name || contextMenu.item.originalName}</p>
            </div>
            {contextMenu.type === 'file' && (
              <>
                <button className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-brand-primary-subtle flex items-center gap-2" onClick={() => { setPreviewFile(contextMenu.item); setContextMenu(null); }}>
                  <AiFillFile className="w-4 h-4" /> Open
                </button>
                <a href={contextMenu.item.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-brand-primary-subtle flex items-center gap-2" onClick={() => setContextMenu(null)}>
                  <Download className="w-4 h-4" /> Download
                </a>
              </>
            )}
            <button className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-brand-primary-subtle flex items-center gap-2" onClick={() => { setRenamingItem({ id: contextMenu.item._id, type: contextMenu.type, currentName: contextMenu.item.name || contextMenu.item.originalName }); setContextMenu(null); }}>
              <Edit2 className="w-4 h-4" /> Rename
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-brand-primary-subtle flex items-center gap-2" onClick={() => openMoveModal(contextMenu.item, contextMenu.type)}>
              <CornerUpRight className="w-4 h-4" /> Move
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-status-danger hover:bg-status-danger-subtle flex items-center gap-2" onClick={() => handleDelete(contextMenu.item._id, contextMenu.type)}>
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}

        {/* Move Modal */}
        {moveItem && (
          <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface-base rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[80vh]">
              <div className="px-5 py-4 border-b border-surface-border flex justify-between items-center">
                <h3 className="font-semibold text-text-primary truncate">Move: {moveItem.name}</h3>
                <button onClick={() => setMoveItem(null)} className="p-1 hover:bg-surface-raised rounded text-text-secondary"><X className="w-5 h-5"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {loadingMoveTree ? (
                  <p className="text-sm text-text-secondary text-center py-4">Loading folders...</p>
                ) : (
                  <>
                    <button
                      onClick={() => handleMove(null)}
                      className="w-full text-left py-2 px-3 hover:bg-brand-primary-subtle rounded flex items-center gap-2 text-sm font-medium text-text-primary transition-colors border border-transparent hover:border-brand-primary-subtle"
                    >
                      <LayoutGrid className="w-4 h-4 text-text-secondary" />
                      Root Level
                    </button>
                    <div className="my-2 border-t border-surface-border" />
                    {renderFolderTree(null, 0)}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewFile(null)} />
          <div className={`relative bg-surface-sunken flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${isFullscreen ? 'fixed inset-0 rounded-none w-full h-full' : 'w-[95vw] h-[95vh] rounded-2xl'}`}>
            <div className="bg-surface-sunken text-white px-4 py-3 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3 overflow-hidden pr-4">
                {getSmallIcon(previewFile.fileType)}
                <h2 className="text-base font-medium truncate" title={previewFile.originalName}>{previewFile.originalName}</h2>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={previewFile.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-text-tertiary hover:text-white hover:bg-surface-sunken rounded-lg transition-colors flex items-center gap-2 text-sm font-medium mr-2">
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-text-tertiary hover:text-white hover:bg-surface-sunken rounded-lg transition-colors">
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
                <button onClick={() => setPreviewFile(null)} className="p-2 text-text-tertiary hover:text-white hover:bg-status-danger/20 hover:text-status-danger rounded-lg transition-colors ml-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative bg-surface-sunken">
              {renderPreviewContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
