import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import React, { useState, useEffect} from 'react';

import { FilePond, registerPlugin } from 'react-filepond';
import type { FilePondFile } from 'filepond';
import 'filepond/dist/filepond.min.css';

import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';

import FilerobotImageEditor, {
  TABS,
  TOOLS,
} from 'react-filerobot-image-editor';

registerPlugin(FilePondPluginImagePreview);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Photos',
        href: '/photo',
    },
];

export default function Index() { 
    const [isImgEditorShown, setIsImgEditorShown] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<any>(null);
    const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);

    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    
    const headers = token ? { 'X-CSRF-TOKEN': token, 'Accept': 'application/json' } : { 'Accept': 'application/json' };

    const openImgEditor = (imageUrl: string) => {
        setUploadedImageUrl(imageUrl);
        setIsImgEditorShown(true);
    };

    const closeImgEditor = () => {
        setIsImgEditorShown(false);
        setUploadedImageUrl(null);
    };

    const handleFileProcess = (error: any, file: FilePondFile) => {
        if (error) {
            console.error('Upload error:', error);
            return;
        }

        try {
            const response = JSON.parse(file.serverId);
            if (response.success && response.url) {
                console.log('Upload successful, opening editor:', response.url);
                openImgEditor(response.url);
            }
        } catch (e) {
            console.error('Error parsing server response:', e);
            if (file.serverId) {
                openImgEditor(file.serverId);
            }
        }
    };

    const saveEditedImageToServer = async (imageBase64: string, filename: string) => {
        try {
            const response = await fetch('/save-edited-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    image: imageBase64,
                    filename: filename,
                }),
            });

            const result = await response.json();

            if (result.success) {
                console.log('Edited image saved to server:', result.url);
                setSavedImageUrl(result.url);
                return result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to save edited image:', error);
            throw error;
        }
    };

    const handleImageSave = async (editedImageObject: any, designState: any) => {
        console.log('Image saved:', editedImageObject);
        setEditedImage(editedImageObject);
        
        try {
            // Save to server
            const result = await saveEditedImageToServer(
                editedImageObject.imageBase64, 
                `edited-${Date.now()}.png`
            );
            
            alert('Image saved successfully! URL: ' + result.url);
            
        } catch (error) {
            alert('Failed to save image to server. Downloading locally instead.');
            
            // Fallback: download locally
            const downloadLink = document.createElement('a');
            downloadLink.href = editedImageObject.imageBase64;
            downloadLink.download = `edited-${Date.now()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
        
        closeImgEditor();
    };

    const [photos, setPhotos] = useState<Array<{
        name: string;
        path: string;
        url: string;
        size: number;
        last_modified: number;
    }>>([]);

    const fetchPhotos = async () => {
        try {
            const response = await fetch('/photos/all');
            const data = await response.json();
            
            if (data.success) {
                setPhotos(data.photos);
            } else {
                console.error('Failed to fetch photos:', data.message);
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, []);


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Photos" />
            <div className="App container mx-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Upload and Edit Photos</h1>
                    
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
                                    onload: (response) => {
                                        console.log('Server response:', response);
                                        return response;
                                    },
                                    onerror: (error) => {
                                        console.error('Server error:', error);
                                        return JSON.stringify({ error: 'Upload failed' });
                                    },
                                },
                                revert: {
                                    url: '/upload',
                                    method: 'DELETE',
                                    headers,
                                    onload: (response) => {
                                        console.log('Delete successful:', response);
                                        return response;
                                    },
                                    onerror: (error) => {
                                        console.error('Delete error:', error);
                                        return JSON.stringify({ error: 'Delete failed' });
                                    },
                                },
                            }}
                            onprocessfile={handleFileProcess}
                            labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                            labelFileProcessing="Uploading..."
                            labelFileProcessingComplete="Upload successful"
                            labelFileProcessingError="Upload failed"
                        />
                    </div>

                    {/* Display saved image */}
                    {savedImageUrl && (
                        <div className="mt-8 p-4 bg-green-50 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 text-green-800">
                                ✅ Image Saved Successfully!
                            </h3>
                            <p className="mb-2 text-green-700">
                                Your edited image has been saved to the server.
                            </p>
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

                    {isImgEditorShown && uploadedImageUrl && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh]">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h2 className="text-xl font-semibold">Edit Image</h2>
                                    <button
                                        onClick={closeImgEditor}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
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
                                        annotationsCommon={{
                                            fill: '#ff0000',
                                        }}
                                        Text={{ text: 'Edit your image...' }}
                                        Rotate={{ angle: 90, componentType: 'slider' }}
                                        Crop={{
                                            presetsItems: [
                                                {
                                                    titleKey: 'classicTv',
                                                    descriptionKey: '4:3',
                                                    ratio: 4 / 3,
                                                },
                                                {
                                                    titleKey: 'cinemascope',
                                                    descriptionKey: '21:9',
                                                    ratio: 21 / 9,
                                                },
                                            ],
                                            presetsFolders: [
                                                {
                                                    titleKey: 'socialMedia',
                                                    groups: [
                                                        {
                                                            titleKey: 'facebook',
                                                            items: [
                                                                {
                                                                    titleKey: 'profile',
                                                                    width: 180,
                                                                    height: 180,
                                                                    descriptionKey: 'fbProfileSize',
                                                                },
                                                                {
                                                                    titleKey: 'coverPhoto',
                                                                    width: 820,
                                                                    height: 312,
                                                                    descriptionKey: 'fbCoverPhotoSize',
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        }}
                                        tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.WATERMARK]}
                                        defaultTabId={TABS.ANNOTATE}
                                        defaultToolId={TOOLS.TEXT}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Photo Gallery */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
                        {photos.map((photo) => (
                            <div key={photo.path} className="relative group">
                                <img 
                                    src={photo.url}
                                    alt={photo.name}
                                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                                    onClick={() => openImgEditor(photo.url)}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-sm truncate">{photo.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}