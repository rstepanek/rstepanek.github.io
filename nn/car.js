class Car{
    constructor(x,y,width,height,controlType,low_res=false,maxSpeed=3,color="blue",numsensors=5){
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
        this.color = color;
        this.speed=0;
        this.acceleration=0.2;
        this.maxSpeed=maxSpeed;
        this.friction=0.05;
        this.angle=0;
        this.damaged=false;
        this.fitness = -100000;
        this.moved_horiz = false;
        this.x_move_max = 1;
        this.init_x = x;
        this.horiz_mov = 0;
        this.low_res = low_res;

        // this.control_log = new Control_log(10);

        this.useBrain=controlType=="AI";

        if(controlType!="DUMMY"){
            this.sensor=new Sensor(this,numsensors);
            this.brain=new NeuralNetwork(
                [this.sensor.rayCount,8,4]
            );
        }
        this.controls=new Controls(controlType);

        if(!this.low_res){
            this.img=new Image();
            this.img.src="nn/car.png"

            this.mask=document.createElement("canvas");
            this.mask.width=width;
            this.mask.height=height;

            const maskCtx=this.mask.getContext("2d");
            this.img.onload=()=>{
                maskCtx.fillStyle=color;
                maskCtx.rect(0,0,this.width,this.height);
                maskCtx.fill();

                maskCtx.globalCompositeOperation="destination-atop";
                maskCtx.drawImage(this.img,0,0,this.width,this.height);
            }
        }
    }

    update(roadBorders,traffic){
        if(!this.damaged){
            this.#move();
            this.polygon=this.#createPolygon();
            this.damaged=this.#assessDamage(roadBorders,traffic);
        }
        if(this.sensor){
            this.sensor.update(roadBorders,traffic);
            const offsets=this.sensor.readings.map(
                s=>s==null?0:1-s.offset
            );
            const outputs=NeuralNetwork.feedForward(offsets,this.brain);

            if(this.useBrain){
                this.controls.forward=outputs[0];
                this.controls.left=outputs[1];
                this.controls.right=outputs[2];
                this.controls.reverse=outputs[3];
            }
        }
        if(!this.damaged){
            this.fitness = this.#calc_fitness(traffic);
        }
    }

    #calc_fitness(traffic){
        let move_bonus = this.horiz_mov;
        let cars_passed = 0;
        for(let i=0;i<traffic.length;i++){
            if(this.y < traffic[i].y) cars_passed +=1;
        }
        return -0.001*this.y + move_bonus + 10000*(cars_passed)+100**(cars_passed);
    }
    #assessDamage(roadBorders,traffic){
        for(let i=0;i<roadBorders.length;i++){
            if(polysIntersect(this.polygon,roadBorders[i])){
                return true;
            }
        }
        for(let i=0;i<traffic.length;i++){
            if(polysIntersect(this.polygon,traffic[i].polygon)){
                return true;
            }
        }
        return false;
    }

    #createPolygon(){
        const points=[];
        const rad=Math.hypot(this.width,this.height)/2;
        const alpha=Math.atan2(this.width,this.height);
        points.push({
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y:this.y-Math.cos(this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y:this.y-Math.cos(this.angle+alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        });
        return points;
    }

    #blowup_car(){
        this.damaged = true;
    }

    #move(){
        if(this.controls.forward){
            this.speed+=this.acceleration;
           // this.control_log.add(0);
        }
        if(this.controls.reverse){
            this.speed-=this.acceleration;
           // this.control_log.add(3);
        }

        if(this.speed>this.maxSpeed){
            this.speed=this.maxSpeed;
        }
        if(this.speed<-this.maxSpeed/2){
            this.speed=-this.maxSpeed/2;
        }

        //if car does not move
        if(this.speed==0){
            if(!this.damaged){
                const t = this.#blowup_car.bind(this);
                setTimeout(() => {
                    if(this.speed==0){
                        t();
                    }
                }, 2000);
            }
        }
        if(this.speed>0){
            this.speed-=this.friction;
        }
        if(this.speed<0){
            this.speed+=this.friction;
        }
        if(Math.abs(this.speed)<this.friction){
            this.speed=0;
        }

        if(this.speed!=0){
            const flip=this.speed>0?1:-1;
            if(this.controls.left){
                this.angle+=0.03*flip;
            }
            if(this.controls.right){
                this.angle-=0.03*flip;
            }
        }

        this.x-=Math.sin(this.angle)*this.speed;
        this.y-=Math.cos(this.angle)*this.speed;
        //reward car for exploring movement up to a point
        if(this.x_move_max > this.horiz_mov) this.horiz_mov += (this.init_x - this.x)**2*0.1;
    }

    draw(ctx,drawSensor=false){
        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }
        if(this.low_res){
            if(this.damaged){
                ctx.fillStyle="gray";
            }else{
                ctx.fillStyle=this.color;
            }
            ctx.beginPath();
            ctx.moveTo(this.polygon[0].x,this.polygon[0].y);
            for(let i=1;i<this.polygon.length;i++){
                ctx.lineTo(this.polygon[i].x,this.polygon[i].y);
            }
            ctx.fill();
            return;
        }


        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.rotate(-this.angle);
        if(!this.damaged){
            ctx.drawImage(this.mask,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height);
            ctx.globalCompositeOperation="multiply";
        }
        ctx.drawImage(this.img,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height);
        ctx.restore();

    }
}

// class Control_log{
//     constructor(log_length=10){
//         this.ll = log_length;
//         this.map = new Map();
//     }
//     add(entry){
//         for(i=this.map.size;i>0;i--){
//             this.map.set(i,this.map.get(i-i));
//         }
//         this.map.set(0,entry);
//         if(this.map.size>this.ll){
//             this.map.delete(this.ll);
//         }
//     }//end add
//     view(){
//         return this.map;
//     }
// }