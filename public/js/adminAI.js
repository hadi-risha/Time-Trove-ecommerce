

const tpass=1234;
const tname='hadi'

function alert1(){
    const pass1 =document.getElementById("passs").value;
    const name1=document.getElementById("namee").value;
     if(pass1==tpass&&name1==tname){
         
        // alert("working")
     }else{
        alert("invalid Admin!");
        req.session.adminPassnotMatch= true;
        
     }
}