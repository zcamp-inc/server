export const getUniversity = (email: string): string | null => {
    //TODO: expand this list or find a service that will.
    
    let uniMap = new Map([
        ['stu.cu.edu.ng', "Covenant University"]
    ]);

    for (let entry of uniMap.entries()){
        if (email.split("@")[-1] === entry[0]){
            return entry[1]
        }
    }
    return null;
}