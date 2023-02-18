/*
* TODO: add nextround/start button
* add round tracker
* add code to advance to next round
* make cars not saved too browser cache,
* changed values take effect on start over,
* except for mutation rate and num parallel
*/

class CarSim{
    constructor(){
        this.N = 80;
        this.max_speed = 3;
        this.round = 0;
        this.mutation_rate = 0.2;
        this.numsensors = 5;
        this.best_fitness = -10000;
        this.carCanvas = document.getElementById("carCanvas");
        // this.carCanvas.width = 200;
        this.networkCanvas = document.getElementById("networkCanvas");
        //this.networkCanvas.width = 300;
        this.low_res = false;

        let parent = this.carCanvas.parentNode;
        this.canvas_height = parent.getBoundingClientRect().height;
        let width = parent.parentNode.getBoundingClientRect().width;
        let lanecount = 2;
        if(width<600){
            this.carCanvas.width = parseInt(width/2);
            this.networkCanvas.width = parseInt(width/2);
        }
        else{
            this.networkCanvas.width = 300;
            this.carCanvas.width = parseInt(width - 300);
            lanecount = 3;
        }
        this.carwidth = parseInt(carCanvas.width*0.9/lanecount*0.4);
        this.carheight = parseInt(1.6*this.carwidth);
        this.carCtx = carCanvas.getContext("2d");
        this.networkCtx = networkCanvas.getContext("2d");

        this.road = new Road(carCanvas.width/2,carCanvas.width*0.9,lanecount);
        document.addEventListener('DOMContentLoaded', (event) => {this.init_ui.bind(this)();});
    }//end constructor
    restart_sim(){
        this.round = 0;
        this.N = (isNaN(Number(this.numcars_field.innerHTML)))?80:Number(this.numcars_field.innerHTML);
        this.max_speed = 3;
        this.round = 0;
        this.mutation_rate = (isNaN(Number(this.mr_field.innerHTML)))?0.2:Number(this.mr_field.innerHTML);
        this.numsensors = (isNaN(Number(this.numsensors_field.innerHTML)))?5:Number(this.numsensors_field.innerHTML);
        this.best_fitness = -10000;
        this.discardnn();
        this.init_sim();
    }
    init_sim(){
        this.round += 1;
        if(this.bestCar) this.savenn();
        document.getElementById("roundnum").innerHTML = this.round;
        this.cars = this.generateCars(this.N);
        if(this.bestCar) this.load_best(); 
        this.bestCar = this.cars[0];
        this.traffic = this.generate_traffic();
        this.animate();
    }
    generateCars(N){
        const cars=[];
        for(let i=1;i<=this.N;i++){
            cars.push(new Car(this.road.getLaneCenter(1),100,this.carwidth,this.carheight,"AI",this.low_res,this.max_speed ,"blue",this.numsensors));
        }
        return cars;
    }
    generate_traffic(){
        let road = this.road;
        const traffic=[
            new Car(road.getLaneCenter(1),-100,this.carwidth,this.carheight,"DUMMY",this.low_res,2,"red"),
            new Car(road.getLaneCenter(0),-300,this.carwidth,this.carheight,"DUMMY",this.low_res,2,"red"),
            
            new Car(road.getLaneCenter(0),-500,this.carwidth,this.carheight,"DUMMY",this.low_res,2,"red"),
           
            new Car(road.getLaneCenter(1),-700,this.carwidth,this.carheight,"DUMMY",this.low_res,2,"red"),
            
        ];
        if(road.laneCount>2){
            traffic.push(new Car(road.getLaneCenter(2),-300,this.carwidth,this.carheight,"DUMMY",this.low_res,2,"red"));
            traffic.push(new Car(road.getLaneCenter(1),-500,this.carwidth,this.carheight,"DUMMY",this.low_res,2,"red"));
            traffic.push(new Car(road.getLaneCenter(2),-700,this.carwidth,this.carheight,"DUMMY",this.low_res,2,"red"));
        }
        return traffic;
    }

    get_N(){return this.N;}

    set_N(num){this.N=num;}

    get_mr(){return this.mutation_rate;}

    set_mr(rate){this.mutation_rate=rate;}

    load_best(){
        if(localStorage.getItem("bestBrain")){
            for(let i=0;i<this.cars.length;i++){
                this.cars[i].brain=JSON.parse(
                    localStorage.getItem("bestBrain"));
                if(i!=0){
                    NeuralNetwork.mutate(this.cars[i].brain,this.mutation_rate);
                }
            }//end for
        }//end if
    }//end load_best

    savenn(){
        if(this.bestCar.fitness > this.best_fitness){
            localStorage.setItem("bestBrain",
                JSON.stringify(this.bestCar.brain));
            this.best_fitness = this.bestCar.fitness;
        }
    }

    discardnn(){
        localStorage.removeItem("bestBrain");
    }
    update_mr(e){
        let val = e.target.innerHTML;
        const max = 1.0;
        const min = 0.0;
        val = Number(val);
        if(isNaN(val)){
            e.target.innerHTML = this.mutation_rate;
            return;
        }
        if(val>max){
            this.mutation_rate = max;
            e.target.innerHTML = max;
        }
        else if(val < min){
            this.mutation_rate = min;
            e.target.innerHTML = min;            
        }
        else{
            this.mutation_rate = val;
        }    
    }
    update_numcars(e){
        let val = e.target.innerHTML;
        const max = 500;
        const min = 0.0;
        val = Number(val);
        if(isNaN(val)){
            e.target.innerHTML = this.N;
            return;
        }
        if(val>max){
            this.N = max;
            e.target.innerHTML = max;
        }
        else if(val < min){
            this.N = min;
            e.target.innerHTML = min;            
        }
        else{
            this.N = val;
        }    
    }
    update_numsensors(e){
        let val = e.target.innerHTML;
        const max = 9;
        const min = 1;
        val = Number(val);
        if(isNaN(val)){
            e.target.innerHTML = this.numsensors;
            return;
        }
        if(val>max){
            this.numsensors = max;
            e.target.innerHTML = max;
        }
        else if(val < min){
            this.numsensors = min;
            e.target.innerHTML = min;            
        }
        else{
            this.numsensors = val;
        }    
    }
    change_res(e){
        this.low_res = e.target.checked;
    }
    terminate_sim(){
        this.cars.forEach(car=>
            car=null);
        delete(this.cars);
        this.traffic.forEach(car=>
            car=null);
        delete(this.traffic);
    }
    init_ui(){
        this.mr_field = document.getElementById("MuteRate");
        this.numcars_field = document.getElementById("NumVehicles");
        this.numsensors_field = document.getElementById("NumSensors");

        this.next_button = document.getElementById("nextbutton");
        this.next_button.addEventListener('click', (event) => {this.init_sim.bind(this)();});

        this.reset_button = document.getElementById("restartbutton");
        this.reset_button.addEventListener('click', (event) => {this.restart_sim.bind(this)();});

        this.terminate_button = document.getElementById("stopsim");
        this.terminate_button.addEventListener('click', (event) => {this.terminate_sim.bind(this)();});


        this.low_res_mode = document.getElementById("lowresmode");
        this.low_res_mode.addEventListener('click', (event) => {this.change_res.bind(this)(event);});
        this.mr_field.innerHTML = this.mutation_rate;
        this.numcars_field.innerHTML = this.N;
        this.numsensors_field.innerHTML = this.numsensors;

        this.mr_field.addEventListener('input', (e) => {
            this.update_mr(e);
        });
        this.numcars_field.addEventListener('input', (e) => {
            this.update_numcars(e);
        });
        this.numsensors_field.addEventListener('input', (e) => {
            this.update_numsensors(e);
        });
    }
    fitness_func(cars){
        return cars.find(
            c=>c.fitness==Math.max(
                ...cars.map(c=>c.fitness)
            ));
    }
    animate(time){
        let traffic = this.traffic;
        let road = this.road;
        let cars = this.cars;
        for(let i=0;i<traffic.length;i++){
            traffic[i].update(road.borders,[]);
        }
        for(let i=0;i<cars.length;i++){
            cars[i].update(road.borders,traffic);
        }
        this.bestCar = this.fitness_func(cars);

        this.carCanvas.height=this.canvas_height;
        this.networkCanvas.height=this.canvas_height;

        this.carCtx.save();
        this.carCtx.translate(0,-this.bestCar.y+this.carCanvas.height*0.7);

        road.draw(this.carCtx);
        for(let i=0;i<traffic.length;i++){
            traffic[i].draw(this.carCtx,"red");
        }
        this.carCtx.globalAlpha=0.2;
        for(let i=0;i<cars.length;i++){
            cars[i].draw(this.carCtx,false);
        }
        this.carCtx.globalAlpha=1;
        this.bestCar.draw(this.carCtx,true);

        this.carCtx.restore();

        this.networkCtx.lineDashOffset=-time/50;
        Visualizer.drawNetwork(this.networkCtx,this.bestCar.brain);
        requestAnimationFrame(this.animate.bind(this));
    }
}
const carsim = new CarSim();