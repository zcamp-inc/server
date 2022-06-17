export const getUniversity = (email: string): string | null => {
    //TODO: expand this list or find a service that will.
    
    let uniMap = new Map([
        ['stu.cu.edu.ng', "Covenant University"],
        ['stu.cu.bro.ng', "Coventry University"]
    ]);

    for (let entry of uniMap.entries()){
        
        if (email.split("@")[1] === entry[0]){
            console.log('Good')
            return entry[1]
        }
    }
    return null;
}