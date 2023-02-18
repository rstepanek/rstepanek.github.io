class Controls{
	constructor(controlType){
		this.forward = false;
		this.left = false;
		this.right = false;
		this.reverese = false;

		switch(controlType){
		case "KEYS":
			this.#addKeyboardListeners();
			break;
		case "DUMMY":
			this.forward=true;
			break;
		}
	}

	#addKeyboardListeners(){
		document.onkeydown=(event)=>{
			switch(event.key){
			case "ArrowLeft":
				this.left=true;break;
			case "ArrowRight":
				this.right=true;break;
			case "ArrowUp":
				this.forward=true;break
			case "ArrowDown":
				this.reverse=true;break;
			}//end switch
			//console.table(this)
		}//end onkeydown

		document.onkeyup=(event)=>{
			switch(event.key){
			case "ArrowLeft":
				this.left=false;break;
			case "ArrowRight":
				this.right=false;break;
			case "ArrowUp":
				this.forward=false;break
			case "ArrowDown":
				this.reverse=false;break;
			}//end switch
		}//end onkeyup
	}//end #addKeyboardListeners
}