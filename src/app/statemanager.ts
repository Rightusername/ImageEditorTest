export class StateManager{
    redo_list = [];
    undo_list = [];

    constructor(private context, private s){

    }

    saveState(canvas, list, keep_redo) {
        keep_redo = keep_redo || false;
        if(!keep_redo) {
            this.redo_list = [];
        }
        (list || this.undo_list).push(canvas.toDataURL());  
    };
    undo(canvas, ctx) {
        this.restoreState(canvas, ctx, this.undo_list, this.redo_list);
    };
    redo(canvas, ctx) {
        this.restoreState(canvas, ctx, this.redo_list, this.undo_list);
    };
    restoreState(canvas, ctx,  pop, push) {
        if(pop.length > 0) {
            this.saveState(canvas, push, true);
            var restore_state = pop.pop();
            var img = new Image();
            img.src = restore_state;
            img.onload = () => {
                this.s.clearCanvas();
                this.s.context.drawImage(img, 0, 0);
            }
        }
    }


}