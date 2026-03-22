import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

function SharedForm({formControls, formData, setFormData, onSubmit, buttonText}) {

    function renderInputsByComponentType(getControlItem) {
        let element = null;
        const value = formData[getControlItem.name] || '';
        switch (getControlItem.componentType) {
            case 'input':
                element = (
                <Input
                    name={getControlItem.name}
                    type={getControlItem.type}
                    placeholder={getControlItem.placeholder}
                    id={getControlItem.name}
                    value={value}
                    onChange = {event => setFormData({
                        ...formData,
                        [getControlItem.name]: event.target.value
                    })}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-white/80"
                />
                );
                break;
            case 'select':
                element = (
                <Select onValueChange={(value) => setFormData({...formData, [getControlItem.name]: value})} value={value} >
                    <SelectTrigger className="w-full h-10 text-sm rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-white/80">
                        <SelectValue placeholder={getControlItem.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-white/20">
                        {
                            getControlItem.options &&
                            getControlItem.options.length > 0 ?
                            getControlItem.options.map(optionItem => <SelectItem key={optionItem.id} value={optionItem.value} className="hover:bg-primary/10">{optionItem.label}</SelectItem>) : null
                        }

                    </SelectContent>
                </Select>
                );
                break;

            case 'textarea':
                element = (
                <Textarea
                    name ={getControlItem.name}
                    placeholder={getControlItem.placeholder}
                    id={getControlItem.id}
                    value={value}
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-white/80 resize-none"
                     onChange = {event => setFormData({
                        ...formData,
                        [getControlItem.name]: event.target.value
                    })}
                />
                );
                break;

            default:
                element = (
                    <Input
                        name={getControlItem.name}
                        type={getControlItem.type}
                        placeholder={getControlItem.placeholder}
                        id={getControlItem.name}
                        value={value}
                         onChange = {event => setFormData({
                        ...formData,
                        [getControlItem.name]: event.target.value
                    })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-white/80"
                />
                );
                break;
        }
        return element;
    }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-4">
            {
                formControls.map(controlItem => <div className="space-y-2" key={controlItem.name}>
                    <Label className="text-xs font-medium text-foreground\">{controlItem.label}</Label>
                    {
                        renderInputsByComponentType(controlItem)
                    }
                </div>)
            }

        </div>
        <Button
            type="submit"
            className="w-full h-10 bg-gradient-primary hover:opacity-90 text-white font-semibold text-sm rounded-lg shadow-medium hover:shadow-large transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
            {buttonText || "Submit"}
        </Button>
    </form>
  );
}

export default SharedForm;