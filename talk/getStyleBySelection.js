getStyleForSelectedText(){
  const selection = this.getSelection()
  if(selection) {
    getStyleForClass(selection)
      .then(result => {
        console.log('RESULT', typeof result)
        atom.clipboard.write(result)
      })
  } else {
    atom.notifications.addInfo('No Selection')
  }
},
