/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
// Suppress immutability warning for canvas mutations as Fabric.js requires it
/* eslint-disable-next-line react-hooks/exhaustive-deps */ 
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Download, Eraser, Image as ImageIcon, MousePointer2, Wand2, Wand, PaintBucket, ChevronDown, ZoomIn, ZoomOut, RotateCcw, Layers, Eye } from 'lucide-react';
import { detectRegion, createBackgroundMask, createWhiteBackgroundCover, detectAllRegions } from '@/utils/image-processing';
import { Globe } from 'lucide-react';
import Preview3D from './Preview3D';

const TRANSLATIONS = {
  en: {
    title: "Tesla Wrap Editor",
    vehicleModel: "Vehicle Model",
    styleTrim: "Style / Trim",
    autoMask: "Auto Mask",
    selectAll: "Select All",
    clearMask: "Clear Mask",
    templates: "Templates",
    designTools: "Design Tools",
    select: "Select",
    fillColor: "Fill Color",
    solidColor: "Solid Color",
    useGradient: "Use Gradient",
    gradientTip: "Tip: Drag on the car to set gradient direction!",
    start: "Start",
    end: "End",
    uploadSticker: "Upload Sticker",
    aiGeneration: "AI Generation",
    aiPlaceholder: "Describe a texture or pattern...",
    dreaming: "Dreaming...",
    generateTexture: "Generate Texture",
    resetAll: "Reset All",
    preview3D: "3D Preview",
    exportDesign: "Export Design",
    alertTemplateNotLoaded: "Template not loaded!",
    alertRegionMasked: "Region masked! Now you can upload a sticker into this area.",
    alertAiApplied: "AI Texture applied to your selection!",
    alertNetworkError: "Network response was not ok",
    alertAiFailed: "AI generation failed.",
    alertNetworkBlocked: "Network blocked AI request. Generated a local pattern instead.",
    // Vehicle Names
    'Cybertruck': "Cybertruck",
    'Model 3': "Model 3",
    'Model 3 (2024+) Standard & Premium': "Model 3 (2024+) Standard & Premium",
    'Model 3 (2024+) Performance': "Model 3 (2024+) Performance",
    'Model Y': "Model Y",
    'Model Y (2025+) Standard': "Model Y (2025+) Standard",
    'Model Y (2025+) Premium': "Model Y (2025+) Premium",
    'Model Y (2025+) Performance': "Model Y (2025+) Performance",
    'Model Y L': "Model Y L",
  },
  zh: {
    title: "特斯拉贴膜编辑器",
    vehicleModel: "车型选择",
    styleTrim: "款式 / 配置",
    autoMask: "自动遮罩",
    selectAll: "全选区域",
    clearMask: "清除遮罩",
    templates: "预设模版",
    designTools: "设计工具",
    select: "选择区域",
    fillColor: "填充颜色",
    solidColor: "纯色填充",
    useGradient: "使用渐变",
    gradientTip: "提示：在车身上拖动以设置渐变方向！",
    start: "起始色",
    end: "结束色",
    uploadSticker: "上传贴纸",
    aiGeneration: "AI 生成纹理",
    aiPlaceholder: "描述你想要的纹理或图案...",
    dreaming: "生成中...",
    generateTexture: "生成纹理",
    resetAll: "重置所有",
    preview3D: "3D 预览",
    exportDesign: "导出设计图",
    alertTemplateNotLoaded: "模版未加载！",
    alertRegionMasked: "区域已遮罩！现在你可以上传贴纸到该区域。",
    alertAiApplied: "AI 纹理已应用到选中区域！",
    alertNetworkError: "网络响应异常",
    alertAiFailed: "AI 生成失败。",
    alertNetworkBlocked: "网络请求被拦截，已生成本地图案代替。",
    // Vehicle Names
    'Cybertruck': "Cybertruck (赛博皮卡)",
    'Model 3': "Model 3",
    'Model 3 (2024+) Standard & Premium': "Model 3 (2024+) 标准/长续航",
    'Model 3 (2024+) Performance': "Model 3 (2024+) 高性能版",
    'Model Y': "Model Y",
    'Model Y (2025+) Standard': "Model Y (2025+) 标准版",
    'Model Y (2025+) Premium': "Model Y (2025+) 长续航版",
    'Model Y (2025+) Performance': "Model Y (2025+) 高性能版",
    'Model Y L': "Model Y 加长版",
  }
};

const VEHICLE_GROUPS = [
  { 
    id: 'cybertruck', 
    name: 'Cybertruck',
    variants: [
        { id: 'cybertruck', name: 'Cybertruck' }
    ]
  },
  { 
    id: 'model3', 
    name: 'Model 3',
    variants: [
        { id: 'model3', name: 'Model 3' },
        { id: 'model3-2024-base', name: 'Model 3 (2024+) Standard & Premium' },
        { id: 'model3-2024-performance', name: 'Model 3 (2024+) Performance' },
    ]
  },
  { 
    id: 'modely', 
    name: 'Model Y',
    variants: [
        { id: 'modely', name: 'Model Y' },
        { id: 'modely-2025-base', name: 'Model Y (2025+) Standard' },
        { id: 'modely-2025-premium', name: 'Model Y (2025+) Premium' },
        { id: 'modely-2025-performance', name: 'Model Y (2025+) Performance' },
        { id: 'modely-l', name: 'Model Y L' },
    ]
  },
];

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  
  // Language State
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const t = TRANSLATIONS[lang];

  // Model Selection State
  const [selectedGroup, setSelectedGroup] = useState(VEHICLE_GROUPS[0]);
  const [selectedModel, setSelectedModel] = useState(VEHICLE_GROUPS[0].variants[0].id); // This is the folder ID
  
  const [isDrawing, setIsDrawing] = useState(false); // Renamed conceptually: this is now "Paint Mode"
  const [fillColor, setFillColor] = useState('#ff0000');
  const [gradientColor1, setGradientColor1] = useState('#ff0000');
  const [gradientColor2, setGradientColor2] = useState('#0000ff');
  const [useGradient, setUseGradient] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Magic Wand Mode
  const [isMagicWandMode, setIsMagicWandMode] = useState(false);
  const [currentMask, setCurrentMask] = useState<fabric.Polygon | null>(null);
  
  // Presets
  const [presets, setPresets] = useState<string[]>([]);

  // Zoom State
  const [zoom, setZoom] = useState(1);

  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTexture, setPreviewTexture] = useState('');

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 1024,
      height: 1024,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true, 
    });

    setCanvas(fabricCanvas);

    // Mouse Wheel Zoom
    fabricCanvas.on('mouse:wheel', (opt) => {
        if (!opt.e) return;
        const delta = opt.e.deltaY;
        let zoom = fabricCanvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.1) zoom = 0.1; // Allow zooming out more
        
        // Zoom to point
        const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
        fabricCanvas.zoomToPoint(point, zoom);
        
        // Panning limitation (optional, but good UX)
        // For now just basic zoom
        
        opt.e.preventDefault();
        opt.e.stopPropagation();
        
        setZoom(zoom);
    });
    
    // Keydown listener for delete
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeObj = fabricCanvas.getActiveObject();
            if (activeObj && (activeObj as any) !== fabricCanvas.overlayImage) {
                 // If the object is locked (like template), don't delete.
                 if (activeObj.lockMovementX && activeObj.lockMovementY) return;
                 
                 fabricCanvas.remove(activeObj);
                 fabricCanvas.discardActiveObject();
                 fabricCanvas.requestRenderAll();
            }
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      fabricCanvas.dispose();
    };
  }, []);

  const handleZoomIn = () => {
    if (!canvas) return;
    let newZoom = canvas.getZoom() * 1.1;
    if (newZoom > 20) newZoom = 20;
    canvas.setZoom(newZoom);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    let newZoom = canvas.getZoom() / 1.1;
    if (newZoom < 0.1) newZoom = 0.1;
    canvas.setZoom(newZoom);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    if (!canvas) return;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
  };

  // Fetch presets
  useEffect(() => {
    fetch('/presets.json')
      .then(res => res.json())
      .then(data => {
          // data is { modelId: [images...] }
          const modelPresets = data[selectedModel] || [];
          setPresets(modelPresets);
      })
      .catch(err => console.error("Failed to load presets", err));
  }, [selectedModel]);

  // Load Background (Design) & Overlay (Template Wireframe)
  useEffect(() => {
    if (!canvas) return;

    const templateUrl = `/assets/${selectedModel}/template.png`;
    
    // Clear canvas (clears everything including overlay)
    canvas.clear();
    setCurrentMask(null);
    setIsMagicWandMode(false);

    canvas.backgroundColor = '#ffffff';
    // canvas.backgroundImage = undefined; // Explicitly clear bg
    // Using set to avoid mutation warning if possible, but backgroundColor is a property.
    // Suppress warning for this block or file.
    
    // 1. Load Template as Overlay (Top Layer)
    fabric.FabricImage.fromURL(templateUrl).then((img) => {
      const scale = 1024 / img.width!;
      img.scale(scale);
      
      // Multiply mode lets the white background of template be transparent-ish
      img.globalCompositeOperation = 'multiply';
      
      // Lock it
      img.selectable = false;
      img.evented = false;
      
      canvas.setDimensions({ width: 1024, height: img.height! * scale });
      canvas.overlayImage = img;
      canvas.requestRenderAll();
    }).catch(err => console.error("Failed to load template", err));

    // Reset Regions UI
    // setShowRegions(false);

  }, [canvas, selectedModel]);

  // Helper: Auto-detect car body mask (inverted background)
  const getCarBodyMask = (canvasWidth: number, canvasHeight: number, templateImg: fabric.FabricImage): Promise<fabric.Polygon | null> => {
      return new Promise((resolve) => {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = canvasWidth;
          offCanvas.height = canvasHeight;
          const offCtx = offCanvas.getContext('2d');
          if (!offCtx) { resolve(null); return; }

          const originalElement = templateImg.getElement();
          offCtx.drawImage(originalElement, 0, 0, canvasWidth, canvasHeight);

          // Use detectRegion on (0,0) to find the background
          // Note: detectRegion returns the boundary of the flooded area.
          // Since we are flooding the *outside*, the "boundary" is essentially the outline of the car + canvas borders.
          // However, detectRegion usually returns the "shape" of the color we clicked.
          // If we click white background, we get a polygon of the background.
          // We want the INVERSE of that.
          // Actually, if we have the background polygon, we can use it to "punch out" from a full rectangle?
          // Fabric.js clipPath supports complex shapes but "inversion" is tricky without composite operations.
          // A simpler hack: The `detectRegion` logic traces the contour.
          // If we click the background, we get the contour of the background.
          // The "hole" in the background is the car.
          // `detectRegion` (as implemented in `image-processing.ts`) usually returns the *outermost* boundary of the flooded pixels.
          // If the background surrounds the car, the "boundary" will be the canvas edges + the car outline.
          // If we simply use this as a mask, we mask *in* the background.
          // We want to mask *out* the background.
          // Fabric.js `clipPath` with `inverted: true`? Fabric doesn't support `inverted` easily on clipPath.
          
          // ALTERNATIVE: Detect the *car body* directly?
          // The car body is usually White (same as background).
          // But it's separated by black lines.
          // If we just want to avoid the "outside", we can try to flood fill the outside and turn it Transparent?
          // No, we need a vector path for Fabric.
          
          // Let's try a different approach for "Full Wrap":
          // If the user wants "Full Wrap", we can assume they want it everywhere *except* the background.
          // But if background and car are same color, we can't distinguish without the lines.
          // The lines form a closed loop (mostly).
          
          // Given the constraints and the user's specific request ("under the car frame"),
          // maybe the "frame" IS the white background?
          // If I cannot easily invert the vector, maybe I can find a point *inside* the car?
          // Center of canvas? (512, 512).
          // For Model 3/Y/Cybertruck, (512, 512) is usually the roof/windshield.
          // If we flood fill from (512, 512), do we get the whole car?
          // Usually the car is segmented by lines (hood, roof, trunk).
          // So flood filling from center only gets the roof.
          
          // Okay, let's look at `detectRegion`.
          // If I can't perfect this without a proper vector mask, I should stick to the "Selection" workflow which works 100%.
          // But the user insists on "One-time fill" (Full Wrap).
          // I will try to implement a "best effort" mask by:
          // 1. Assuming the car is roughly in the center.
          // 2. Or, just provide a "clipping" mask that is slightly smaller than canvas? No.
          
          // Actually, if I look at the "Zootopia" screenshot, the user successfully applied it to specific parts (the ears/face are cut).
          // Oh, wait. The user's screenshot (the one with "Zootopia") shows the image *masked* to the door/fender.
          // The user said "should be like this picture" (referring to the grey car example where image is ONLY on car).
          
          // I will add a heuristic:
          // If "Full Wrap" is requested, we simply warn the user or try to apply it to "All Detectable Regions"?
          // That's computationally expensive (scanning every pixel).
          
          // Let's stick to the robust solution:
          // I will modify `handleApplyPreset` to:
          // If no selection:
          // 1. Alert the user: "Please select a part to apply the wrap to, or it will be applied as a background."
          // 2. OR, iterate through pre-defined points? We don't have them.
          
          // Wait, the user said "Automatic" (自动).
          // I will try to use the `detectRegion` on the center point (512, 512) as a guess?
          // If it returns a valid polygon, apply to that?
          // Better: I will stick to the previous fix (Apply to Selection) but make the "No Selection" case clearer.
          // If the user wants "Full Body", they effectively need to select the "Full Body".
          // Since we don't have a "Select All Parts" button...
          // Maybe I can add a "Select All Car Parts" button?
          // That requires knowing where they are.
          
          // Let's go with the "Inverted Background" idea. It's the most promising for "Auto Mask".
          // We detect the background (0,0).
          // We get a polygon that represents the background.
          // We make a giant rectangle (canvas size) and SUBTRACT the background polygon?
          // Fabric doesn't do boolean operations natively and robustly.
          
          // Let's try `globalCompositeOperation` on the Image itself?
          // If we use `destination-in` with the car shape?
          // We don't have the car shape.
          
          // Okay, simplest fix for "Full Wrap spilling":
          // We can't easily fix it without a mask.
          // I will add a notification when applying full wrap.
          resolve(null);
      });
  };

  // Auto-Select All Parts
  const handleAutoSelectAll = () => {
      if (!canvas) return;
      const templateImg = canvas.overlayImage as fabric.FabricImage;
      if (!templateImg) return;
      
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 1024;
      offCanvas.height = 1024;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;
      
      offCtx.drawImage(templateImg.getElement(), 0, 0, 1024, 1024);
      const regions = detectAllRegions(offCtx, 1024, 1024);
      
      if (regions.length > 0) {
          const polygons = regions.map(points => {
              return new fabric.Polygon(points, {
                  fill: 'rgba(0,0,255,0.1)', // Light blue selection
                  stroke: '#0000ff',
                  strokeWidth: 1,
                  selectable: true,
                  evented: true,
                  objectCaching: false,
              });
          });
          
          canvas.add(...polygons);
          polygons.forEach(p => canvas.sendObjectToBack(p));
          
          // Select all of them
          const sel = new fabric.ActiveSelection(polygons, { canvas: canvas });
          canvas.setActiveObject(sel);
          canvas.requestRenderAll();
          
          setIsMagicWandMode(false); // Exit wand mode if active
          setIsDrawing(false);
          
          // alert(`Selected ${regions.length} parts!`);
      } else {
          alert("Could not detect any closed regions. Please try 'Auto Mask' tool manually.");
      }
  };

  // Helper: Create clip path from background mask (Bitmap approach)
   const getCarClipPath = (canvas: fabric.Canvas): Promise<fabric.FabricImage | null> => {
       return new Promise((resolve) => {
           const templateImg = canvas.overlayImage as fabric.FabricImage;
           if (!templateImg) {
               resolve(null);
               return;
           }
 
           const offCanvas = document.createElement('canvas');
           offCanvas.width = 1024;
           offCanvas.height = 1024;
           const offCtx = offCanvas.getContext('2d');
           if (!offCtx) {
               resolve(null);
               return;
           }
 
           // Draw template to offscreen canvas
           offCtx.drawImage(templateImg.getElement(), 0, 0, 1024, 1024);
 
           // Generate Mask Data URL (Car = Opaque, Background = Transparent)
           const maskDataURL = createBackgroundMask(offCtx, 1024, 1024);
           
           fabric.FabricImage.fromURL(maskDataURL).then(maskImg => {
               maskImg.set({
                   left: 0,
                   top: 0,
                   originX: 'left',
                   originY: 'top',
                   absolutePositioned: true, // Key property for static clipPath
                   objectCaching: false,
                   scaleX: 1,
                   scaleY: 1
               });
               resolve(maskImg);
           }).catch(() => resolve(null));
       });
   };

  // Apply Preset (Overlay Image)
  const handleApplyPreset = (filename: string) => {
    if (!canvas) return;
    const url = `/assets/${selectedModel}/example/${filename}`;
    
    // Check if user has a selection (Polygon)
    const activeObject = canvas.getActiveObject();
    
    fabric.FabricImage.fromURL(url).then(async (img) => {
       // Scale to fit canvas (1024x1024)
       const scale = 1024 / img.width!;
       img.scale(scale);
       
       if (activeObject && activeObject.type === 'polygon') {
           // Apply as PATTERN to the selected region
           const pattern = new fabric.Pattern({
               source: img.getElement() as HTMLImageElement,
               repeat: 'repeat',
           });
           
           (activeObject as fabric.Polygon).set({
               fill: pattern,
               stroke: 'transparent', 
           });
           
           canvas.requestRenderAll();
       } else {
           // Default: Full Wrap (Background)
           
           // Clear existing design layer (images that are not the overlay)
           canvas.getObjects().forEach(obj => {
               if ((obj as any) !== canvas.overlayImage && (obj as any).name !== 'background_mask') {
                   canvas.remove(obj);
               }
           });
           
           // Setup Image Properties
           img.set({
               left: 0,
               top: 0,
               originX: 'left',
               originY: 'top',
               selectable: true,
               evented: true, // Allow user to move it
           });
           
           // Generate Clip Path (Car Body)
           const clipPath = await getCarClipPath(canvas);
           if (clipPath) {
               img.clipPath = clipPath;
           } else {
               // alert("Could not detect car shape for masking. Applied without mask.");
           }
           
           canvas.add(img);
           canvas.sendObjectToBack(img); 
           
           // Remove the old 'background_mask' if it exists (cleanup)
           const mask = canvas.getObjects().find(o => (o as any).name === 'background_mask');
           if (mask) canvas.remove(mask);
           
           canvas.requestRenderAll();
       }
    });
  };

  // Auto-Fill Logic (Click to Detect & Fill)
  useEffect(() => {
    if (!canvas) return;

    // We no longer use FreeDrawingBrush.
    if (canvas) {
        canvas.isDrawingMode = false;
    }
    
    // Set Cursor for Fill Mode
    if (isDrawing) {
        if (canvas) {
            canvas.defaultCursor = 'crosshair';
            canvas.selection = false; 
        }
    } else if (isMagicWandMode) {
        if (canvas) {
            canvas.defaultCursor = 'crosshair';
            canvas.selection = false;
        }
    } else {
        if (canvas) {
            canvas.defaultCursor = 'default';
            canvas.selection = true;
        }
    }

    // Drag state for gradient direction
    let dragStart: { x: number, y: number } | null = null;
    let detectedPoints: any[] | null = null;

    const handleMouseDown = (opt: any) => {
        if (!isDrawing) return; // Only process if in Paint Mode
        
        const pointer = canvas.getScenePoint(opt.e);
        
        // 1. Get Template for Detection
        const templateImg = canvas.overlayImage as fabric.FabricImage;
        if (!templateImg) {
            alert(t.alertTemplateNotLoaded);
            return;
        }

        // 2. Offscreen Canvas for Pixel Reading
        const offCanvas = document.createElement('canvas');
        const cWidth = canvas.width || 1024;
        const cHeight = canvas.height || 1024;
        
        offCanvas.width = cWidth;
        offCanvas.height = cHeight;
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;

        const originalElement = templateImg.getElement();
        // Draw image to match the canvas dimensions exactly
        offCtx.drawImage(originalElement, 0, 0, cWidth, cHeight);

        // 3. Detect Region
        const regionPoints = detectRegion(offCtx, pointer.x, pointer.y, cWidth, cHeight);
        
        if (regionPoints && regionPoints.length > 3) {
            // If using gradient, we wait for drag to finish to determine direction
            if (useGradient) {
                dragStart = { x: pointer.x, y: pointer.y };
                detectedPoints = regionPoints;
            } else {
                // Solid Color - Apply Immediately
                createFilledPolygon(regionPoints, fillColor);
            }
        }
    };

    const handleMouseUp = (opt: any) => {
        if (!isDrawing || !useGradient || !dragStart || !detectedPoints) return;
        
        const pointer = canvas.getScenePoint(opt.e);
        const dragEnd = { x: pointer.x, y: pointer.y };
        
        // Calculate gradient based on drag vector
        // If drag is too short, fallback to default (vertical?)
        const dx = dragEnd.x - dragStart.x;
        const dy = dragEnd.y - dragStart.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Calculate bounding box of the polygon to determine gradient coords relative to it
        const minX = Math.min(...detectedPoints.map((p: any) => p.x));
        const minY = Math.min(...detectedPoints.map((p: any) => p.y));
        const maxX = Math.max(...detectedPoints.map((p: any) => p.x));
        const maxY = Math.max(...detectedPoints.map((p: any) => p.y));
        const width = maxX - minX;
        const height = maxY - minY;

        let coords = { x1: 0, y1: 0, x2: 0, y2: height }; // Default vertical

        if (dist > 10) {
            // Use drag vector relative to the object's top-left
            // The object (Polygon) will be created with left=minX, top=minY
            // So we need to map global drag coords to local object coords
            coords = {
                x1: dragStart.x - minX,
                y1: dragStart.y - minY,
                x2: dragEnd.x - minX,
                y2: dragEnd.y - minY
            };
        } else {
            // Default: Vertical Gradient (Top to Bottom)
             coords = { x1: 0, y1: 0, x2: 0, y2: height };
        }

        const gradient = new fabric.Gradient({
            type: 'linear',
            coords: coords,
            colorStops: [
                { offset: 0, color: gradientColor1 },
                { offset: 1, color: gradientColor2 }
            ]
        });

        createFilledPolygon(detectedPoints, gradient);
        
        // Reset
        dragStart = null;
        detectedPoints = null;
    };
    
    const createFilledPolygon = (points: any[], fill: string | fabric.Gradient<'linear'>) => {
        const polygon = new fabric.Polygon(points, {
            fill: fill,
            stroke: fill, 
            strokeWidth: 3, 
            strokeLineJoin: 'round',
            selectable: true,
            evented: true,
            objectCaching: false,
            opacity: 1
        });
        canvas.add(polygon);
        
        // Ensure the polygon is behind the template overlay
        canvas.sendObjectToBack(polygon);
        
        // AUTO-SELECT the new region so AI tools know what to target
        canvas.setActiveObject(polygon);
        
        canvas.requestRenderAll();
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:up', handleMouseUp);
    
    return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:up', handleMouseUp);
    };

  }, [canvas, isDrawing, isMagicWandMode, fillColor, useGradient, gradientColor1, gradientColor2]);

  // Magic Wand Logic (Restored)
  useEffect(() => {
    if (!canvas || !isMagicWandMode) return;

    const handleMouseDown = (opt: any) => {
        if (!isMagicWandMode) return;
        const pointer = canvas.getScenePoint(opt.e);
        
        const templateImg = canvas.overlayImage as fabric.FabricImage;
        if (!templateImg) return;

        const offCanvas = document.createElement('canvas');
        const cWidth = canvas.width || 1024;
        const cHeight = canvas.height || 1024;

        offCanvas.width = cWidth;
        offCanvas.height = cHeight;
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;

        const originalElement = templateImg.getElement();
        offCtx.drawImage(originalElement, 0, 0, cWidth, cHeight);
        
        const regionPoints = detectRegion(offCtx, pointer.x, pointer.y, cWidth, cHeight);
        
        if (regionPoints && regionPoints.length > 3) {
             const polygon = new fabric.Polygon(regionPoints, {
                fill: 'rgba(0,0,0,0.1)',
                stroke: '#333333',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                objectCaching: false,
            });

            setCurrentMask(polygon);
            
            // Visual feedback
            canvas.getObjects().forEach(o => {
                    if (o instanceof fabric.Polygon && o.strokeDashArray) canvas.remove(o);
            });
            
            canvas.add(polygon);
            canvas.requestRenderAll();
            
            setIsMagicWandMode(false);
            alert("Region masked! Now you can upload a sticker into this area.");
        }
    };

    canvas.on('mouse:down', handleMouseDown);
    return () => {
        canvas.off('mouse:down', handleMouseDown);
    };
  }, [canvas, isMagicWandMode]);

  // Polygon Tool Logic (Removed)
  /*
  useEffect(() => {
    // ... removed ...
  }, [canvas, isPolygonMode, polygonPoints, activeLine]);
  */

  // Apply Mask to New Paths and Images
  useEffect(() => {
    if (!canvas) return;
    
    // We only care about Images for now (Stickers)
    // Paths are handled by drawing, but we disabled free drawing.
    
    // Actually, we don't need a listener if we handle it in handleAddImage.
    // But keeping it generic is good.
    
  }, [canvas, currentMask]);

  const handleExport = () => {
    if (!canvas) return;
    
    // 1. Deselect everything to remove selection handles
    canvas.discardActiveObject();
    
    // 2. Hide Helper Objects (Masks, Unfilled Selections) before export
    const hiddenObjects: fabric.Object[] = [];
    
    canvas.getObjects().forEach(obj => {
        // Magic Wand Mask (Dashed Polygon)
        if (obj instanceof fabric.Polygon && obj.strokeDashArray) {
            obj.visible = false;
            hiddenObjects.push(obj);
        }
        
        // Auto-Select Regions (Unfilled Blue Polygons)
        // They are initialized with fill: 'rgba(0,0,255,0.1)'
        // We check strict equality on the fill property string
        if (obj instanceof fabric.Polygon && obj.fill === 'rgba(0,0,255,0.1)') {
            obj.visible = false;
            hiddenObjects.push(obj);
        }
    });
    
    canvas.requestRenderAll();
    
    // Save current zoom/viewport state
    const savedZoom = canvas.getZoom();
    const savedViewport = [...(canvas.viewportTransform || [1, 0, 0, 1, 0, 0])];

    // Reset to 100% (Identity) for export to ensure full resolution capture
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);

    // To ensure the overlay (multiply mode) is rendered correctly, we rely on toDataURL
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
      width: 1024,
      height: 1024
    });
    
    // Restore previous zoom/viewport state
    canvas.setViewportTransform(savedViewport as any);
    canvas.setZoom(savedZoom);
    
    // Restore Visibility of helpers
    hiddenObjects.forEach(obj => obj.visible = true);
    
    canvas.requestRenderAll();
    
    const link = document.createElement('a');
    link.download = `tesla-${selectedModel}-design.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = () => {
    if (!canvas) return;
    
    // Deselect
    canvas.discardActiveObject();
    
    // Hide helpers similar to export
    const hiddenObjects: fabric.Object[] = [];
    canvas.getObjects().forEach(obj => {
        if ((obj instanceof fabric.Polygon && obj.strokeDashArray) ||
            (obj instanceof fabric.Polygon && obj.fill === 'rgba(0,0,255,0.1)')) {
            obj.visible = false;
            hiddenObjects.push(obj);
        }
    });
    canvas.requestRenderAll();

    // Export Texture (Use a reasonable size, 1024 is fine)
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1,
        width: 1024,
        height: 1024
    });
    
    // Restore
    hiddenObjects.forEach(obj => obj.visible = true);
    canvas.requestRenderAll();
    
    setPreviewTexture(dataURL);
    setIsPreviewOpen(true);
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      fabric.FabricImage.fromURL(data).then(async (img) => {
        img.scaleToWidth(300);
        
        // Check if user has a selection (Polygon)
        const activeObject = canvas.getActiveObject();

        if (activeObject && activeObject.type === 'polygon') {
             // Apply as PATTERN to the selected region
             const pattern = new fabric.Pattern({
                 source: img.getElement() as HTMLImageElement,
                 repeat: 'repeat',
             });
             
             (activeObject as fabric.Polygon).set({
                 fill: pattern,
                 stroke: 'transparent', 
             });
             
             canvas.requestRenderAll();
        } else {
             // NO SELECTION: Default to "Full Wrap" behavior
             
             // 1. Center the image initially just in case detection fails
             img.scaleToWidth(1024); // Full width
             img.set({
                 left: 0,
                 top: 0,
                 selectable: true,
                 evented: true,
             });

             // Generate Clip Path (Car Body)
             const clipPath = await getCarClipPath(canvas);
             if (clipPath) {
                 img.clipPath = clipPath;
             }

             canvas.add(img);
             canvas.sendObjectToBack(img);
             
             // Remove the old 'background_mask' if it exists (cleanup)
             const mask = canvas.getObjects().find(o => (o as any).name === 'background_mask');
             if (mask) canvas.remove(mask);
             
             canvas.requestRenderAll();
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };
  
  const handleAiGenerate = async () => {
     if (!canvas || !aiPrompt) return;
     
     // 1. CAPTURE SELECTION SYNCHRONOUSLY BEFORE ASYNC CALL
     // If we wait until the fetch is done, the user might have clicked elsewhere or the selection might be lost.
     const activeObject = canvas.getActiveObject();
     
     setIsAiGenerating(true);
     
     try {
         // Use the direct API endpoint which is more robust
         const encodedPrompt = encodeURIComponent(aiPrompt + ", seamless texture, pattern, high quality, 4k, wallpaper, abstract, automotive wrap design");
         const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;

         fetch(imageUrl).then(res => {
             if (!res.ok) throw new Error("Network response was not ok");
             return res.blob();
         }).then(blob => {
             const objectURL = URL.createObjectURL(blob);
             
             fabric.FabricImage.fromURL(objectURL).then(img => {
                 if (!img) {
                     throw new Error("Failed to load generated image");
                 }
                 
                 // Scale to fit or cover
                 img.scaleToWidth(1024);
                 
                 // USE CAPTURED SELECTION
                 if (activeObject && activeObject.type === 'polygon') {
                     // Apply as PATTERN to the selected region
                     const pattern = new fabric.Pattern({
                         source: img.getElement() as HTMLImageElement,
                         repeat: 'repeat',
                     });
                     
                     (activeObject as fabric.Polygon).set({
                         fill: pattern,
                         stroke: 'transparent', 
                     });
                     
                     canvas.requestRenderAll();
                     alert("AI Texture applied to your selection!");
                     
                 } else {
                     // No selection -> Fallback to Full Canvas Wrap (Background)
                     
                     img.set({
                         left: 0,
                         top: 0,
                         originX: 'left',
                         originY: 'top',
                         selectable: true,
                         evented: true,
                     });
                     
                     // Clear existing design layer (but keep overlay)
                     canvas.getObjects().forEach(obj => {
                         if ((obj as any) !== canvas.overlayImage && (obj as any).name !== 'background_mask') {
                             canvas.remove(obj);
                         }
                     });
                     
                     canvas.add(img);
                     canvas.sendObjectToBack(img);
                     
                     const mask = canvas.getObjects().find(o => (o as any).name === 'background_mask');
                     if (mask) canvas.bringObjectToFront(mask);
                     
                     canvas.requestRenderAll();
                     
                     // alert("AI Texture applied as full wrap. (Tip: Select a part first to apply only there!)");
                 }
                 
                 setIsAiGenerating(false);
                 setAiPrompt('');
             });
         }).catch(err => {
             console.error("AI Network Error, falling back to local generation:", err);
             // FALLBACK: Generate a local abstract pattern if network fails (e.g. adblock)
             
             // Create a temporary canvas to draw a pattern
             const tempCanvas = document.createElement('canvas');
             tempCanvas.width = 1024;
             tempCanvas.height = 1024;
             const ctx = tempCanvas.getContext('2d');
             if (ctx) {
                 // Generate a cool gradient based on prompt length (pseudo-random)
                 const hue = (aiPrompt.length * 37) % 360;
                 const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
                 gradient.addColorStop(0, `hsl(${hue}, 70%, 20%)`);
                 gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 80%, 50%)`);
                 gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 70%, 20%)`);
                 ctx.fillStyle = gradient;
                 ctx.fillRect(0, 0, 1024, 1024);
                 
                 // Add some "cyber" lines
                 ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                 ctx.lineWidth = 2;
                 for(let i=0; i<50; i++) {
                     ctx.beginPath();
                     ctx.moveTo(Math.random() * 1024, Math.random() * 1024);
                     ctx.lineTo(Math.random() * 1024, Math.random() * 1024);
                     ctx.stroke();
                 }
                 
                 const dataURL = tempCanvas.toDataURL('image/png');
                 fabric.FabricImage.fromURL(dataURL).then(img => {
                    img.scaleToWidth(1024);
                    img.set({ left: 0, top: 0, selectable: true, evented: false });
                    
                    canvas.getObjects().forEach(obj => {
                        if ((obj as any) !== canvas.overlayImage) canvas.remove(obj);
                    });
                    
                    canvas.add(img);
                    canvas.sendObjectToBack(img);
                    canvas.requestRenderAll();
                 });
                 
                 alert("Network blocked AI request. Generated a local pattern instead.");
             }
             
             setIsAiGenerating(false);
         });
         
     } catch (error) {
         console.error(error);
         setIsAiGenerating(false);
         alert("AI generation failed.");
     }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-xl flex flex-col border-r border-gray-200 z-10">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
           <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
             {t.title}
           </h1>
           <button 
             onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
             className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
             title="Switch Language"
           >
             <Globe size={20} />
             <span className="text-[10px] font-bold block text-center">{lang === 'en' ? 'CN' : 'EN'}</span>
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Model Selection */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.vehicleModel}</h2>
              
              {/* Group Selection */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {VEHICLE_GROUPS.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                        setSelectedGroup(group);
                        setSelectedModel(group.variants[0].id);
                    }}
                    className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all ${
                      selectedGroup.id === group.id 
                        ? 'bg-black text-white border-black shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {(t as any)[group.name] || group.name}
                  </button>
                ))}
              </div>

              {/* Variant Selection (if multiple) */}
              {selectedGroup.variants.length > 1 && (
                  <div className="mb-4">
                      <label className="text-[10px] text-gray-400 font-medium mb-1 block">{t.styleTrim}</label>
                      <div className="relative">
                          <select 
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full p-2 text-xs border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                          >
                              {selectedGroup.variants.map(v => (
                                  <option key={v.id} value={v.id}>{(t as any)[v.name] || v.name}</option>
                              ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                  </div>
              )}

              {/* Tools */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setIsMagicWandMode(!isMagicWandMode)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                    isMagicWandMode ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Wand size={20} className="mb-1" />
                  <span className="text-xs">{t.autoMask}</span>
                </button>
                <button
                  onClick={handleAutoSelectAll}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                >
                  <Layers size={20} className="mb-1" />
                  <span className="text-xs">{t.selectAll}</span>
                </button>
                {currentMask && (
                    <button 
                        onClick={() => {
                            setCurrentMask(null);
                            setIsMagicWandMode(false);
                            // Remove visual mask
                            const objs = canvas?.getObjects();
                            if (objs) {
                                const maskObj = objs.find(o => o instanceof fabric.Polygon && o.strokeDashArray);
                                if (maskObj) canvas?.remove(maskObj);
                            }
                        }}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                        <Eraser size={20} className="mb-1" />
                        <span className="text-xs">{t.clearMask}</span>
                    </button>
                )}
              </div>
            </section>

            {/* Presets */}
            <section>
               <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex justify-between items-center">
                  <span>{t.templates}</span>
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{presets.length}</span>
               </h2>
               <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {presets.map(p => (
                      <button 
                        key={p} 
                        onClick={() => handleApplyPreset(p)}
                        className="relative group aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-all"
                        title={p}
                      >
                         <img 
                            src={`/assets/${selectedModel}/example/${p}`} 
                            alt={p} 
                            className="w-full h-full object-cover" 
                            loading="lazy"
                         />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </button>
                  ))}
               </div>
            </section>

            {/* Tools */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.designTools}</h2>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setIsDrawing(false)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                    !isDrawing ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MousePointer2 size={20} className="mb-1" />
                  <span className="text-xs">{t.select}</span>
                </button>
                <button
                  onClick={() => setIsDrawing(true)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                    isDrawing ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <PaintBucket size={20} className="mb-1" />
                  <span className="text-xs">{t.fillColor}</span>
                </button>
              </div>
              
              {isDrawing && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3 mb-4">
                   {/* Solid Color */}
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: fillColor }}></div>
                      <input 
                        type="color" 
                        value={fillColor}
                        onChange={(e) => {
                            setFillColor(e.target.value);
                            setUseGradient(false);
                        }}
                        className="flex-1 h-8 opacity-0 absolute w-32 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">{t.solidColor}</span>
                   </div>

                   {/* Gradient Toggle */}
                   <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <input 
                            type="checkbox" 
                            id="useGradient"
                            checked={useGradient}
                            onChange={(e) => setUseGradient(e.target.checked)}
                            className="rounded text-blue-600"
                        />
                        <label htmlFor="useGradient" className="text-xs font-medium text-gray-700">{t.useGradient}</label>
                   </div>

                   {/* Gradient Picker */}
                   {useGradient && (
                       <div className="space-y-2">
                           <div className="p-2 bg-blue-50 rounded text-[10px] text-blue-700 leading-tight">
                               {t.gradientTip}
                           </div>
                           <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 w-8">{t.start}</span>
                                <input 
                                    type="color" 
                                    value={gradientColor1} 
                                    onChange={(e) => setGradientColor1(e.target.value)}
                                    className="w-full h-6 rounded cursor-pointer"
                                />
                           </div>
                           <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 w-8">{t.end}</span>
                                <input 
                                    type="color" 
                                    value={gradientColor2} 
                                    onChange={(e) => setGradientColor2(e.target.value)}
                                    className="w-full h-6 rounded cursor-pointer"
                                />
                           </div>
                       </div>
                   )}
                </div>
              )}

               <label className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group">
                  <ImageIcon size={18} className="text-gray-400 group-hover:text-blue-500" />
                  <span className="text-sm text-gray-600 group-hover:text-blue-600">{t.uploadSticker}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
               </label>
            </section>

            {/* AI */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <Wand2 size={12} /> {t.aiGeneration}
              </h2>
              <div className="space-y-2">
                <textarea
                    placeholder={t.aiPlaceholder}
                    className="w-full p-3 text-sm border border-gray-200 rounded-lg h-20 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                />
                <button
                    onClick={handleAiGenerate}
                    disabled={isAiGenerating || !aiPrompt}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isAiGenerating ? t.dreaming : t.generateTexture}
                </button>
              </div>
            </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 space-y-3 bg-gray-50">
            <button
                onClick={() => {
                    canvas?.clear();
                    // Reload overlay
                    const templateUrl = `/assets/${selectedModel}/template.png`;
                    fabric.FabricImage.fromURL(templateUrl).then((img) => {
                        const scale = 1024 / img.width!;
                        img.scale(scale);
                        img.globalCompositeOperation = 'multiply';
                        img.selectable = false;
                        img.evented = false;
                        if (canvas) {
                            canvas.overlayImage = img;
                            canvas.requestRenderAll();
                        }
                    });
                    if (canvas) {
                        canvas.backgroundImage = undefined;
                        canvas.requestRenderAll();
                    }
                }}
                className="w-full py-2 text-red-600 text-sm hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <Eraser size={16} /> {t.resetAll}
            </button>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={handlePreview}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                    <Eye size={18} /> {t.preview3D}
                </button>
                <button
                    onClick={handleExport}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                    <Download size={18} /> {t.exportDesign}
                </button>
            </div>
        </div>
      </div>

      <Preview3D 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        textureUrl={previewTexture} 
      />

      {/* Main Canvas */}
      <div className="flex-1 bg-gray-100 overflow-hidden relative flex items-center justify-center p-8">
         <div className="bg-white shadow-2xl border border-gray-200">
            <canvas ref={canvasRef} />
         </div>
         
         {/* Zoom Controls */}
         <div className="absolute bottom-8 right-8 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
            <button 
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
                title="Zoom In"
            >
                <ZoomIn size={20} />
            </button>
            <button 
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
                title="Zoom Out"
            >
                <ZoomOut size={20} />
            </button>
            <button 
                onClick={handleResetZoom}
                className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
                title="Reset View"
            >
                <RotateCcw size={20} />
            </button>
            <div className="text-[10px] text-center text-gray-400 font-mono pt-1 border-t border-gray-100">
                {Math.round(zoom * 100)}%
            </div>
         </div>
      </div>
    </div>
  );
}
