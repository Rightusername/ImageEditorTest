import { Component, ViewChild } from '@angular/core';
import { ResizeOptions, ImageResult } from "ng2-imageupload";
import { StateManager } from "../statemanager";
import { Filters } from "../filters";

@Component({
  selector: 'draw-area',
  templateUrl: './drawarea.component.html',
  styleUrls: ['./drawarea.component.less']
})
export class DrawAreaComponent {
    @ViewChild("canvas") canvas;

    @ViewChild("fGrayness") fGrayness;
    @ViewChild("fBrightness") fBrightness;
    @ViewChild("fDesaturate") fDesaturate;
    @ViewChild("fMosaic") fMosaic;
    @ViewChild("fDisplacementMapFilter") fDisplacementMapFilter;
    @ViewChild("fFlip") fFlip;
    @ViewChild("fGamma") fGamma;
    @ViewChild("fInvert") fInvert;

    context :CanvasRenderingContext2D;

    dragging = false;
    newCanvasHeight;
    newCanvasWidth;
    lineWidth;
    lineColor;

    stateManager;
    filters;
    src: string = "";

    constructor(){
        this.stateManager = new StateManager(this.context, this);
        this.filters = new Filters();
        this.getData();
       
    }


    
    resizeOptions: ResizeOptions = {};
     
    selected(imageResult: ImageResult) {
        this.src = imageResult.resized
            && imageResult.resized.dataURL
            || imageResult.dataURL;

        let img = new Image();
        img.src = this.src;
        img.onload = ()=>{
            this.context.canvas.width = img.width;
            this.context.canvas.height =  img.height;
            this.context.drawImage(img, 0, 0);
            this.stateManager.saveState(this.context.canvas, false, false);
            this.saveData();
            this.initView();

        }
    }

    ngAfterViewInit() {

        let canvas = this.canvas.nativeElement;
        this.context = canvas.getContext("2d");

        this.context.lineWidth = this.lineWidth*2;
        this.context.strokeStyle = this.lineColor;
        this.context.fillStyle = this.lineColor;
        this.clearCanvas();
        this.getCanvasSize();
    }

    initView(){
        let fGrayness = this.fGrayness.nativeElement;
        let fBrightness = this.fBrightness.nativeElement;
        let fDesaturate = this.fDesaturate.nativeElement;
        let fMosaic = this.fMosaic.nativeElement;
        let fDisplacementMapFilter = this.fDisplacementMapFilter.nativeElement;
        let fFlip = this.fFlip.nativeElement;
        let fGamma = this.fGamma.nativeElement;
        let fInvert = this.fInvert.nativeElement;

        let fGraynessContext = fGrayness.getContext("2d");
        let fBrightnessContext = fBrightness.getContext("2d");
        let fDesaturateContext = fDesaturate.getContext("2d");
        let fMosaicContext = fMosaic.getContext("2d");
        let fDisplacementMapFilterContext = fDisplacementMapFilter.getContext("2d");
        let fFlipContext = fFlip.getContext("2d");
        let fGammaContext = fGamma.getContext("2d");
        let fInvertContext = fInvert.getContext("2d");

        fGraynessContext.canvas.width = this.context.canvas.width;
        fBrightnessContext.canvas.width = this.context.canvas.width;
        fDesaturateContext.canvas.width = this.context.canvas.width;
        fMosaicContext.canvas.width = this.context.canvas.width;
        fDisplacementMapFilterContext.canvas.width = this.context.canvas.width;
        fFlipContext.canvas.width = this.context.canvas.width;
        fGammaContext.canvas.width = this.context.canvas.width;
        fInvertContext.canvas.width = this.context.canvas.width;

        fGraynessContext.canvas.height = this.context.canvas.height;
        fBrightnessContext.canvas.height = this.context.canvas.height;
        fDesaturateContext.canvas.height = this.context.canvas.height;
        fMosaicContext.canvas.height = this.context.canvas.height;
        fDisplacementMapFilterContext.canvas.height = this.context.canvas.height;
        fFlipContext.canvas.height = this.context.canvas.height;
        fGammaContext.canvas.height = this.context.canvas.height;
        fInvertContext.canvas.height = this.context.canvas.height;

        fGraynessContext.putImageData(this.filters.Grayness(this.context), 0, 0);
        fBrightnessContext.putImageData(this.filters.Brightness(this.context), 0, 0);
        fDesaturateContext.putImageData(this.filters.Desaturate(this.context), 0, 0);
        fMosaicContext.putImageData(this.filters.Mosaic(this.context), 0, 0);
        fDisplacementMapFilterContext.putImageData(this.filters.DisplacementMapFilter(this.context), 0, 0);
        fFlipContext.putImageData(this.filters.Flip(this.context), 0, 0);
        fGammaContext.putImageData(this.filters.Gamma(this.context), 0, 0);
        fInvertContext.putImageData(this.filters.Invert(this.context), 0, 0);
    }


    initOptions(){
        this.context.lineWidth = this.lineWidth*2;
        this.context.strokeStyle = this.lineColor;
        this.context.fillStyle = this.lineColor;
    }

    clearCanvas(){
        this.context.fillStyle = '#fff';
        this.context.fillRect(0,0,this.context.canvas.width, this.context.canvas.height);
    }

    resetCanvas(){
        this.stateManager.saveState(this.context.canvas, false, false);
        this.saveData();
        this.context.canvas.width = this.newCanvasWidth = window.outerWidth - 30;
        this.context.canvas.height = this.newCanvasHeight = window.outerHeight - 190;
        this.clearCanvas();
    }

    changeCanvasSize(){
        let canvas = this.context.canvas.toDataURL();
        this.context.canvas.width = this.newCanvasWidth;
        this.context.canvas.height = this.newCanvasHeight;
        this.context.fillStyle = '#fff';
        this.context.fillRect(0,0,this.newCanvasWidth, this.newCanvasHeight);
        var img = new Image();
        img.src = canvas;
        img.onload = () => {
            this.context.drawImage(img, 0, 0);
            this.saveData();
        }
    }
    


    engage(e){
        this.initOptions();
        this.dragging = true;
        this.stateManager.saveState(this.context.canvas, false, false);
        this.putPoint(e);
    }

    disengage(e){
        this.dragging = false;
        this.context.beginPath();
        this.saveData();


    }

    putPoint(e){
        if(!this.dragging) return;
        this.context.lineTo(e.offsetX, e.offsetY);
        this.context.stroke();
        this.context.beginPath();
        this.context.arc(e.offsetX, e.offsetY, this.lineWidth, 0, Math.PI*2);
        this.context.fill();
        this.context.beginPath();
        this.context.moveTo(e.offsetX, e.offsetY);
    }

    downloadCanvas(e) {
        e.preventDefault();
        var a = document.createElement('a');
        a.href = this.context.canvas.toDataURL().replace("image/png", "image/octet-stream");
        a.download = "image.png";
        a.click();
    }

    saveData(){
        let history = {
            undo_list : this.stateManager.undo_list.slice(0,10),
            redo_list : this.stateManager.redo_list.slice(0,10),
            canvas_width: this.context.canvas.width,
            canvas_height: this.context.canvas.height,
            lineColor: this.lineColor,
            lineWidth: this.lineWidth,
            lastState : this.context.canvas.toDataURL()
        }
        localStorage.setItem('history', JSON.stringify( history ) );
    }

    getData(){
        let data = JSON.parse( localStorage.getItem('history') );
        if(data){
            this.stateManager.undo_list = data.undo_list;
            this.stateManager.redo_list = data.redo_list;
            this.lineColor = data.lineColor;
            this.lineWidth = data.lineWidth;
            this.newCanvasHeight = data.canvas_height;
            this.newCanvasWidth = data.canvas_width;
            var img = new Image();
            img.src = data.lastState;
            img.onload = () => {
                this.clearCanvas();
                this.context.drawImage(img, 0, 0);
                this.initView();
            }
        } else {
            this.lineWidth = 3;
            this.lineColor = '#202020';
        }
    }



    getCanvasSize(){
        let data = JSON.parse( localStorage.getItem('history') );
        if(data){
            this.context.canvas.height = data.canvas_height;
            this.context.canvas.width = data.canvas_width;
            this.context.strokeStyle = this.lineColor;
            this.context.fillStyle = this.lineColor;
            this.context.lineWidth = this.lineWidth*2;
        }
    }
      
}
