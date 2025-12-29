import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

import { FilePond, registerPlugin } from 'react-filepond';
import type { FilePondFile } from 'filepond';
import 'filepond/dist/filepond.min.css';

import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';

import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor';

registerPlugin(FilePondPluginImagePreview);

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Photos', href: '/photo' },
];

type Album = { id: number; name: string };

type Photo = {
  id: number;
  name: string;
  path: string;
  url: string;
  size: number;
  album_id: number | null;
  created_at?: string;
};

export default function Index() {
  const params = new URLSearchParams(window.location.search);
  const isPicker = params.get('picker') === '1';
  const pickerItemId = params.get('itemId');
  const pickerReturn = params.get('return');

  const [isImgEditorShown, setIsImgEditorShown] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<any>(null);

  const [albums, setAlbums] = useState<Album[]>([]);
  // ✅ IMPORTANT: "all" will behave like "Unsorted Inbox"
  const [activeAlbumId, setActiveAlbumId] = useState<number | 'all'>('all');

  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'size'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const [photos, setPhotos] = useState<Photo[]>([]);

  // drag state (for UI highlight)
  const [draggingPhotoId, setDraggingPhotoId] = useState<number | null>(null);
  const [dropHoverAlbum, setDropHoverAlbum] = useState<number | 'unsorted' | null>(null);

  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
  const headers = token
    ? { 'X-CSRF-TOKEN': token, Accept: 'application/json' }
    : { Accept: 'application/json' };

  const normalizeUrl = (u: string) => {
    if (!u) return u;
    try {
      const url = new URL(u, window.location.origin);
      if (url.hostname === 'localhost' && window.location.hostname === '127.0.0.1') {
        url.hostname = '127.0.0.1';
        url.port = window.location.port;
      }
      return url.toString();
    } catch {
      return u;
    }
  };

  const returnToReport = (url: string) => {
    if (!isPicker || !pickerItemId || !pickerReturn) return;
    router.get(
      pickerReturn,
      { itemId: pickerItemId, image: normalizeUrl(url) },
      { replace: true }
    );
  };

  const openImgEditor = (imageUrl: string) => {
    setUploadedImageUrl(normalizeUrl(imageUrl));
    setIsImgEditorShown(true);
  };

  const closeImgEditor = () => {
    setIsImgEditorShown(false);
    setUploadedImageUrl(null);
  };

  // ✅ move photo to album (drag/drop OR dropdown)
  const movePhotoToAlbum = async (photoId: number, album_id: number | null) => {
    await fetch(`/photos/${photoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ album_id }),
    });

    // refresh list after move
    fetchPhotos();
  };

  const fetchPhotos = async () => {
    try {
      const qs = new URLSearchParams();

      // ✅ IMPORTANT: "All Photos" page should show UNSORTED only
      // so when photo moved to folder, it disappears from "All Photos"
      if (activeAlbumId === 'all') {
        qs.set('album_id', 'null'); // backend treats "null" as whereNull(album_id)
      } else {
        qs.set('album_id', String(activeAlbumId));
      }

      qs.set('sort', sortBy);
      qs.set('dir', sortDir);

      if (search.trim()) qs.set('q', search.trim());

      const res = await fetch(`/photos/all?${qs.toString()}`, { headers });

      if (!res.ok) {
        console.error('Failed to fetch photos:', res.status);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setAlbums(data.albums || []);
        setPhotos(data.photos || []);
      } else {
        console.error('Fetch failed:', data.message || data);
      }
    } catch (e) {
      console.error('Error fetching photos:', e);
    }
  };

  useEffect(() => {
    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAlbumId, sortBy, sortDir]);

  // upload handler
  const handleFileProcess = (error: any, file: FilePondFile) => {
    if (error) {
      console.error('Upload error:', error);
      return;
    }

    try {
      const response = JSON.parse(file.serverId);
      if (!response?.success || !response?.url) {
        console.error('Invalid upload response', response);
        return;
      }

      if (isPicker) openImgEditor(response.url);
      else fetchPhotos();
    } catch (e) {
      console.error('Error parsing upload response:', e);
    }
  };

  const saveEditedImageToServer = async (imageBase64: string, filename: string) => {
    const response = await fetch('/save-edited-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': token,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        filename,
        // Optional: if you want edited image saved into current folder
        album_id: activeAlbumId === 'all' ? null : activeAlbumId,
      }),
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.message || 'Save failed');

    setSavedImageUrl(result.url);
    return result;
  };

  const handleImageSave = async (editedImageObject: any) => {
    setEditedImage(editedImageObject);

    try {
      const result = await saveEditedImageToServer(
        editedImageObject.imageBase64,
        `edited-${Date.now()}.png`
      );

      if (isPicker && pickerItemId && pickerReturn) {
        returnToReport(result.url);
        closeImgEditor();
        return;
      }

      alert('Image saved successfully! URL: ' + result.url);
      fetchPhotos();
    } catch (error) {
      console.error(error);
      alert('Failed to save image to server. Downloading locally instead.');

      const downloadLink = document.createElement('a');
      downloadLink.href = editedImageObject.imageBase64;
      downloadLink.download = `edited-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    closeImgEditor();
  };

  // ✅ DRAG EVENTS
  const onDragStartPhoto = (e: React.DragEvent, photoId: number) => {
    setDraggingPhotoId(photoId);
    e.dataTransfer.setData('photoId', String(photoId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEndPhoto = () => {
    setDraggingPhotoId(null);
    setDropHoverAlbum(null);
  };

  const onDragOverFolder = (e: React.DragEvent, albumKey: number | 'unsorted') => {
    e.preventDefault();
    setDropHoverAlbum(albumKey);
    e.dataTransfer.dropEffect = 'move';
  };

  const onDropFolder = async (e: React.DragEvent, albumKey: number | 'unsorted') => {
    e.preventDefault();

    const photoIdStr = e.dataTransfer.getData('photoId');
    const photoId = Number(photoIdStr);
    if (!photoId) return;

    setDropHoverAlbum(null);

    if (albumKey === 'unsorted') {
      await movePhotoToAlbum(photoId, null);
    } else {
      await movePhotoToAlbum(photoId, albumKey);
    }
  };

  const activeTitle = useMemo(() => {
    if (activeAlbumId === 'all') return 'All Photos (Unsorted)';
    const a = albums.find((x) => x.id === activeAlbumId);
    return a ? a.name : 'Folder';
  }, [activeAlbumId, albums]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Photos" />

      <div className="container mx-auto p-6">
        <div className="flex gap-6">
          {/* MAIN */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Upload and Edit Photos</h1>
            <p className="text-sm text-gray-500 mb-4">
              Viewing: <span className="font-semibold">{activeTitle}</span>
            </p>

            {/* TOP BAR */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* ✅ “All Photos” = Unsorted only */}
              <button
                type="button"
                className={`border rounded px-3 py-2 text-sm ${
                  activeAlbumId === 'all' ? 'bg-gray-100 font-semibold' : ''
                }`}
                onClick={() => setActiveAlbumId('all')}
              >
                All Photos
              </button>

              {/* sort */}
              <select
                className="border rounded px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="created_at">Sort: Date</option>
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
              </select>

              <button
                type="button"
                className="border rounded px-3 py-2 text-sm"
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              >
                {sortDir === 'asc' ? 'Asc' : 'Desc'}
              </button>

              {/* search */}
              <input
                className="border rounded px-3 py-2 text-sm w-56"
                placeholder="Search file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchPhotos();
                }}
              />
              <button
                type="button"
                className="border rounded px-3 py-2 text-sm"
                onClick={() => fetchPhotos()}
              >
                Search
              </button>

              {/* create folder */}
              <button
                type="button"
                className="ml-auto bg-[#CD202C] text-white rounded px-4 py-2 text-sm font-semibold"
                onClick={async () => {
                  const name = prompt('Folder name?');
                  if (!name) return;

                  const res = await fetch('/albums', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...headers },
                    body: JSON.stringify({ name }),
                  });

                  const data = await res.json();

                  if (data.success) {
                    setAlbums((prev) => [...prev, data.album]);
                    setActiveAlbumId(data.album.id); // go into folder
                    fetchPhotos();
                  } else {
                    alert(data.message || 'Failed to create folder');
                  }
                }}
              >
                + Folder
              </button>
            </div>

            {/* FILEPOND */}
            <div className="mb-8">
              <FilePond
                name="file"
                allowMultiple={false}
                maxFiles={1}
                acceptedFileTypes={['image/*']}
                server={{
                  process: {
                    url: '/upload',
                    method: 'POST',
                    headers,
                    ondata: (formData) => {
                      // ✅ if currently inside a folder, upload directly into that folder
                      if (activeAlbumId !== 'all') {
                        formData.append('album_id', String(activeAlbumId));
                      }
                      return formData;
                    },
                    onload: (response) => response,
                  },
                }}
                onprocessfile={handleFileProcess}
                labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
              />
            </div>

            {/* Saved image preview */}
            {savedImageUrl && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-green-800">✅ Image Saved!</h3>
                <img
                  src={savedImageUrl}
                  alt="Saved edited"
                  className="max-w-full h-auto rounded shadow-md max-h-64"
                />
                <div className="mt-2">
                  <a
                    href={savedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Open image in new tab
                  </a>
                </div>
              </div>
            )}

            {/* IMAGE EDITOR MODAL */}
            {isImgEditorShown && uploadedImageUrl && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh]">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">Edit Image</h2>
                    <button onClick={closeImgEditor} className="text-gray-500 hover:text-gray-700">
                      Close
                    </button>
                  </div>
                  <div className="h-[calc(90vh-80px)]">
                    <FilerobotImageEditor
                      source={uploadedImageUrl}
                      onSave={handleImageSave}
                      onClose={closeImgEditor}
                      savingPixelRatio={4}
                      previewPixelRatio={2}
                      annotationsCommon={{ fill: '#ff0000' }}
                      tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.WATERMARK]}
                      defaultTabId={TABS.ANNOTATE}
                      defaultToolId={TOOLS.TEXT}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PHOTO GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
              {photos.map((photo) => {
                const fixedUrl = normalizeUrl(photo.url);

                return (
                  <div
                    key={photo.id}
                    className={`relative group rounded-lg overflow-hidden ${
                      draggingPhotoId === photo.id ? 'ring-2 ring-[#CD202C]' : ''
                    }`}
                    draggable
                    onDragStart={(e) => onDragStartPhoto(e, photo.id)}
                    onDragEnd={onDragEndPhoto}
                    title="Drag me into a folder on the right"
                  >
                    <img
                      src={fixedUrl}
                      alt={photo.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />

                    {/* overlay buttons */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                      {/* move dropdown still allowed */}
                      <select
                        className="text-xs rounded px-2 py-1 w-full max-w-[160px]"
                        value={photo.album_id ?? ''}
                        onChange={async (e) => {
                          const album_id = e.target.value === '' ? null : Number(e.target.value);
                          await movePhotoToAlbum(photo.id, album_id);
                        }}
                      >
                        <option value="">Unsorted</option>
                        {albums.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>

                      {isPicker ? (
                        <>
                          <button
                            type="button"
                            onClick={() => returnToReport(fixedUrl)}
                            className="px-3 py-1 rounded bg-white text-black text-xs font-semibold"
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            onClick={() => openImgEditor(fixedUrl)}
                            className="px-3 py-1 rounded bg-[#CD202C] text-white text-xs font-semibold"
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openImgEditor(fixedUrl)}
                          className="px-3 py-1 rounded bg-white text-black text-xs font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                      <p className="truncate">{photo.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDEBAR: FOLDERS */}
          <aside className="w-[280px] shrink-0">
            <div className="sticky top-6">
              <h3 className="text-sm font-semibold mb-2">Folders</h3>

              {/* UNSORTED DROP ZONE */}
              <div
                className={`border rounded-lg p-3 mb-3 cursor-pointer select-none ${
                  dropHoverAlbum === 'unsorted' ? 'bg-red-50 border-[#CD202C]' : 'bg-white'
                }`}
                onClick={() => setActiveAlbumId('all')}
                onDragOver={(e) => onDragOverFolder(e, 'unsorted')}
                onDragLeave={() => setDropHoverAlbum(null)}
                onDrop={(e) => onDropFolder(e, 'unsorted')}
                title="Drop photo here to make it Unsorted"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Unsorted (All Photos)</span>
                  <span className="text-xs text-gray-500">drop here</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Photos here show in “All Photos”.
                </p>
              </div>

              {/* ALBUMS LIST */}
              <div className="space-y-2">
                {albums.map((a) => (
                  <div
                    key={a.id}
                    className={`border rounded-lg p-3 cursor-pointer select-none ${
                      activeAlbumId === a.id ? 'bg-gray-50 border-gray-400' : 'bg-white'
                    } ${dropHoverAlbum === a.id ? 'bg-red-50 border-[#CD202C]' : ''}`}
                    onClick={() => setActiveAlbumId(a.id)}
                    onDragOver={(e) => onDragOverFolder(e, a.id)}
                    onDragLeave={() => setDropHoverAlbum(null)}
                    onDrop={(e) => onDropFolder(e, a.id)}
                    title="Drop photo here"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{a.name}</span>
                      <span className="text-xs text-gray-500">drop</span>
                    </div>

                    {/* optional rename */}
                    <button
                      type="button"
                      className="mt-2 text-xs text-blue-600 hover:underline"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const newName = prompt('Rename folder:', a.name);
                        if (!newName) return;

                        const res = await fetch(`/albums/${a.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', ...headers },
                          body: JSON.stringify({ name: newName }),
                        });

                        const data = await res.json();

                        if (data.success) {
                          setAlbums((prev) =>
                            prev.map((x) => (x.id === a.id ? { ...x, name: newName } : x))
                          );
                        } else {
                          alert(data.message || 'Rename failed');
                        }
                      }}
                    >
                      Rename
                    </button>
                  </div>
                ))}

                {albums.length === 0 && (
                  <div className="text-xs text-gray-500 border rounded-lg p-3 bg-white">
                    No folders yet. Click <b>+ Folder</b> to create one.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
